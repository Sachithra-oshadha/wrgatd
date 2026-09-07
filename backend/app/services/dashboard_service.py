from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import String, and_, case, cast, func, select
from sqlalchemy.orm import Session, selectinload

from app.core.weeks import current_week_bounds
from app.models.project import Project
from app.models.report_blocker import ReportBlocker
from app.models.report_hours import ReportHours
from app.models.report_task import ReportTask
from app.models.report_version import ReportVersion
from app.models.review_comment import ReviewComments
from app.models.user import User, UserRole
from app.models.weekly_report import WeeklyReport


SUBMITTED_STATUSES = ("SUBMITTED", "NEEDS_CORRECTION", "APPROVED")


def _current_version_ids():
    newest = (
        select(
            ReportVersion.report_id.label("report_id"),
            func.max(ReportVersion.version_number).label("version_number"),
        )
        .group_by(ReportVersion.report_id)
        .subquery()
    )

    return (
        select(ReportVersion.version_id)
        .join(
            newest,
            and_(
                ReportVersion.report_id == newest.c.report_id,
                ReportVersion.version_number == newest.c.version_number,
            ),
        )
        .scalar_subquery()
    )


def _expected_reporter_count(db: Session) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.is_active.is_(True),
                User.role == UserRole.TEAM_MEMBER,
            )
        )
        or 0
    )


def personal_summary(db: Session, user: User) -> dict:
    week_start, week_end = current_week_bounds()

    counts = dict(
        db.execute(
            select(WeeklyReport.status, func.count())
            .where(WeeklyReport.user_id == user.user_id)
            .group_by(WeeklyReport.status)
        ).all()
    )

    this_week = db.scalar(
        select(WeeklyReport)
        .where(
            WeeklyReport.user_id == user.user_id,
            WeeklyReport.week_start == week_start,
        )
        .options(
            selectinload(WeeklyReport.project),
            selectinload(WeeklyReport.user),
            selectinload(WeeklyReport.versions),
        )
    )

    needs_correction = list(
        db.scalars(
            select(WeeklyReport)
            .where(
                WeeklyReport.user_id == user.user_id,
                WeeklyReport.status == "NEEDS_CORRECTION",
            )
            .options(
                selectinload(WeeklyReport.project),
                selectinload(WeeklyReport.user),
                selectinload(WeeklyReport.versions),
            )
            .order_by(WeeklyReport.week_start.desc())
        ).all()
    )

    total = sum(counts.values())
    approved = counts.get("APPROVED", 0)

    return {
        "week_start": week_start,
        "week_end": week_end,
        "current_week_report": this_week,
        "total_reports": total,
        "draft_count": counts.get("DRAFT", 0),
        "submitted_count": counts.get("SUBMITTED", 0),
        "needs_correction_count": counts.get("NEEDS_CORRECTION", 0),
        "approved_count": approved,
        "approval_rate": round(approved / total * 100, 1) if total else 0.0,
        "needs_correction_reports": needs_correction,
    }

def team_summary(
    db: Session,
    *,
    week_start: date | None = None,
    project_id: int | None = None,
) -> dict:

    if week_start is None:
        week_start, week_end = current_week_bounds()
    else:
        week_end = week_start + timedelta(days=6)

    conditions = [WeeklyReport.week_start == week_start]

    if project_id is not None:
        conditions.append(WeeklyReport.project_id == project_id)

    counts = dict(
        db.execute(
            select(WeeklyReport.status, func.count())
            .where(*conditions)
            .group_by(WeeklyReport.status)
        ).all()
    )

    submitted = sum(
        counts.get(status, 0) for status in SUBMITTED_STATUSES
    )

    expected = _expected_reporter_count(db)

    open_blockers = (
        db.scalar(
            select(func.count())
            .select_from(ReportBlocker)
            .join(
                ReportVersion,
                ReportVersion.version_id == ReportBlocker.version_id,
            )
            .join(
                WeeklyReport,
                WeeklyReport.report_id == ReportVersion.report_id,
            )
            .where(
                ReportBlocker.version_id.in_(_current_version_ids()),
                WeeklyReport.week_start == week_start,
                WeeklyReport.status != "APPROVED",
                *(
                    [WeeklyReport.project_id == project_id]
                    if project_id is not None
                    else []
                ),
            )
        )
        or 0
    )

    return {
        "week_start": week_start,
        "week_end": week_end,
        "expected_reports": expected,
        "submitted_count": submitted,
        "draft_count": counts.get("DRAFT", 0),
        "approved_count": counts.get("APPROVED", 0),
        "needs_correction_count": counts.get("NEEDS_CORRECTION", 0),
        "awaiting_review_count": counts.get("SUBMITTED", 0),
        "not_started_count": max(0, expected - submitted),
        "compliance_percent": (
            round(submitted / expected * 100, 1) if expected else 0.0
        ),
        "open_blockers": open_blockers,
    }

def tasks_trend(
    db: Session,
    *,
    weeks: int = 8,
    user_id: int | None = None,
    project_id: int | None = None,
) -> list[dict]:
    """Chart 1: completed tasks per week."""

    week_start, _ = current_week_bounds()
    earliest = week_start - timedelta(weeks=weeks - 1)

    conditions = [
        WeeklyReport.week_start >= earliest,
        ReportTask.version_id.in_(_current_version_ids()),
        ReportTask.status == "COMPLETED",
    ]

    if user_id is not None:
        conditions.append(WeeklyReport.user_id == user_id)

    if project_id is not None:
        conditions.append(WeeklyReport.project_id == project_id)

    rows = db.execute(
        select(
            WeeklyReport.week_start,
            func.count(ReportTask.task_id),
        )
        .select_from(ReportTask)
        .join(
            ReportVersion,
            ReportVersion.version_id == ReportTask.version_id,
        )
        .join(
            WeeklyReport,
            WeeklyReport.report_id == ReportVersion.report_id,
        )
        .where(*conditions)
        .group_by(WeeklyReport.week_start)
        .order_by(WeeklyReport.week_start)
    ).all()

    by_week = {row[0]: row[1] for row in rows}

    # emit every week in range, including the empty ones
    return [
        {
            "week_start": earliest + timedelta(weeks=offset),
            "completed_tasks": by_week.get(
                earliest + timedelta(weeks=offset), 0
            ),
        }
        for offset in range(weeks)
    ]


def workload_by_project(
    db: Session,
    *,
    week_start: date | None = None,
) -> list[dict]:
    """Chart 3: hours per project for a week."""

    if week_start is None:
        week_start, _ = current_week_bounds()

    rows = db.execute(
        select(
            Project.name,
            func.coalesce(func.sum(ReportHours.hours), 0),
            func.count(func.distinct(WeeklyReport.report_id)),
        )
        .select_from(ReportHours)
        .join(
            ReportVersion,
            ReportVersion.version_id == ReportHours.version_id,
        )
        .join(
            WeeklyReport,
            WeeklyReport.report_id == ReportVersion.report_id,
        )
        .join(Project, Project.project_id == WeeklyReport.project_id)
        .where(
            ReportHours.version_id.in_(_current_version_ids()),
            WeeklyReport.week_start == week_start,
        )
        .group_by(Project.name)
        .order_by(func.sum(ReportHours.hours).desc())
    ).all()

    return [
        {
            "project": name,
            "hours": float(hours or 0),
            "report_count": report_count,
        }
        for name, hours, report_count in rows
    ]


def hours_breakdown(
    db: Session,
    *,
    week_start: date | None = None,
    user_id: int | None = None,
) -> list[dict]:
    """Chart 4: hours by task type."""

    if week_start is None:
        week_start, _ = current_week_bounds()

    conditions = [
        ReportHours.version_id.in_(_current_version_ids()),
        WeeklyReport.week_start == week_start,
    ]

    if user_id is not None:
        conditions.append(WeeklyReport.user_id == user_id)

    rows = db.execute(
        select(
            ReportHours.task_type,
            func.coalesce(func.sum(ReportHours.hours), 0),
        )
        .select_from(ReportHours)
        .join(
            ReportVersion,
            ReportVersion.version_id == ReportHours.version_id,
        )
        .join(
            WeeklyReport,
            WeeklyReport.report_id == ReportVersion.report_id,
        )
        .where(*conditions)
        .group_by(ReportHours.task_type)
        .order_by(func.sum(ReportHours.hours).desc())
    ).all()

    return [
        {"task_type": task_type, "hours": float(hours or 0)}
        for task_type, hours in rows
    ]

def submission_by_member(
    db: Session,
    *,
    week_start: date | None = None,
) -> list[dict]:
    if week_start is None:
        week_start, week_end = current_week_bounds()
    else:
        week_end = week_start + timedelta(days=6)

    rows = db.execute(
        select(
            User.user_id,
            User.first_name,
            User.last_name,
            WeeklyReport.report_id,
            WeeklyReport.status,
            Project.name,
        )
        .select_from(User)
        .outerjoin(
            WeeklyReport,
            and_(
                WeeklyReport.user_id == User.user_id,
                WeeklyReport.week_start == week_start,
            ),
        )
        .outerjoin(
            Project, Project.project_id == WeeklyReport.project_id
        )
        .where(
            User.is_active.is_(True),
            User.role == UserRole.TEAM_MEMBER,
        )
        .order_by(User.first_name, User.last_name)
    ).all()

    today = date.today()

    return [
        {
            "user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "report_id": report_id,
            "project": project_name,
            "status": (
                report_status
                if report_status
                else ("LATE" if week_end < today else "NOT_STARTED")
            ),
        }
        for (
            user_id,
            first_name,
            last_name,
            report_id,
            report_status,
            project_name,
        ) in rows
    ]


def activity_feed(db: Session, *, limit: int = 15) -> list[dict]:
    submissions = db.execute(
        select(
            WeeklyReport.report_id,
            WeeklyReport.submitted_at,
            User.first_name,
            User.last_name,
        )
        .join(User, User.user_id == WeeklyReport.user_id)
        .where(WeeklyReport.submitted_at.is_not(None))
        .order_by(WeeklyReport.submitted_at.desc())
        .limit(limit)
    ).all()

    reviews = db.execute(
        select(
            ReviewComments.report_id,
            ReviewComments.created_at,
            ReviewComments.action,
            User.first_name,
            User.last_name,
        )
        .join(User, User.user_id == ReviewComments.reviewer_id)
        .order_by(ReviewComments.created_at.desc())
        .limit(limit)
    ).all()

    events = [
        {
            "report_id": report_id,
            "at": at,
            "kind": "SUBMITTED",
            "actor": f"{first} {last}",
        }
        for report_id, at, first, last in submissions
    ] + [
        {
            "report_id": report_id,
            "at": at,
            "kind": action,
            "actor": f"{first} {last}",
        }
        for report_id, at, action, first, last in reviews
    ]

    events.sort(key=lambda event: event["at"], reverse=True)

    return events[:limit]


def member_stats(db: Session, user_id: int) -> dict:
    counts = dict(
        db.execute(
            select(WeeklyReport.status, func.count())
            .where(WeeklyReport.user_id == user_id)
            .group_by(WeeklyReport.status)
        ).all()
    )

    total = sum(counts.values())
    submitted = sum(
        counts.get(status, 0) for status in SUBMITTED_STATUSES
    )

    first_week = db.scalar(
        select(func.min(WeeklyReport.week_start)).where(
            WeeklyReport.user_id == user_id
        )
    )

    expected = 0

    if first_week:
        this_week, _ = current_week_bounds()
        expected = ((this_week - first_week).days // 7) + 1

    return {
        "total_reports": total,
        "submitted_count": counts.get("SUBMITTED", 0),
        "approved_count": counts.get("APPROVED", 0),
        "needs_correction_count": counts.get("NEEDS_CORRECTION", 0),
        "draft_count": counts.get("DRAFT", 0),
        "expected_reports": expected,
        "compliance_percent": (
            round(min(submitted, expected) / expected * 100, 1)
            if expected
            else 0.0
        ),
    }
