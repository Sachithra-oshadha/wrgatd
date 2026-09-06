from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.next_week_task import NextWeekTask
from app.models.project import Project
from app.models.report_achievement import ReportAchievement
from app.models.report_blocker import ReportBlocker
from app.models.report_hours import ReportHours
from app.models.report_task import ReportTask
from app.models.report_version import ReportVersion
from app.models.review_comment import ReviewComments
from app.models.user import User, UserRole
from app.models.weekly_report import WeeklyReport
from app.schemas.report import (
    ReportStatus,
    WeeklyReportCreate,
    WeeklyReportUpdate,
)

EDITABLE_STATUSES = {
    ReportStatus.DRAFT.value,
    ReportStatus.NEEDS_CORRECTION.value,
}

def _detail_options():

    return (
        selectinload(WeeklyReport.user),
        selectinload(WeeklyReport.project),
        selectinload(WeeklyReport.versions).selectinload(
            ReportVersion.tasks
        ),
        selectinload(WeeklyReport.versions).selectinload(
            ReportVersion.next_week_tasks
        ),
        selectinload(WeeklyReport.versions).selectinload(
            ReportVersion.blockers
        ),
        selectinload(WeeklyReport.versions).selectinload(
            ReportVersion.achievements
        ),
        selectinload(WeeklyReport.versions).selectinload(
            ReportVersion.hours
        ),
        selectinload(WeeklyReport.reviews).selectinload(
            ReviewComments.reviewer
        ),
        selectinload(WeeklyReport.reviews).selectinload(
            ReviewComments.version
        ),
    )

def current_version(report: WeeklyReport) -> ReportVersion:
    """The newest version. Every report has at least one."""

    if not report.versions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Report has no versions",
        )

    return report.versions[-1]

def can_read(report: WeeklyReport, user: User) -> bool:

    if report.user_id == user.user_id:
        return True

    return user.role in (UserRole.MANAGER, UserRole.ADMIN)

def assert_can_read(report: WeeklyReport, user: User) -> None:
    if not can_read(report, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this report",
        )

def assert_can_edit(report: WeeklyReport, user: User) -> None:

    if report.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own reports",
        )

    if report.status not in EDITABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"A report with status {report.status} cannot be edited. "
                "Only DRAFT and NEEDS_CORRECTION reports are editable."
            ),
        )

def _replace_children(
    version: ReportVersion,
    data: WeeklyReportCreate | WeeklyReportUpdate,
) -> None:
    """Replace every child collection with the submitted content.

    Relies on cascade="all, delete-orphan" (M2 B3): clearing the list
    issues the DELETEs, appending issues the INSERTs, all in one flush.
    """

    version.tasks.clear()
    version.next_week_tasks.clear()
    version.blockers.clear()
    version.achievements.clear()
    version.hours.clear()

    for task in data.tasks:
        version.tasks.append(
            ReportTask(
                task_name=task.task_name,
                priority=task.priority.value,
                planned_percent=task.planned_percent,
                actual_percent=task.actual_percent,
                status=task.status.value,
                time_planned=task.time_planned,
                time_spent=task.time_spent,
                deliverable=task.deliverable,
            )
        )

    for item in data.next_week_tasks:
        version.next_week_tasks.append(
            NextWeekTask(
                description=item.description,
                priority=item.priority.value,
            )
        )

    for blocker in data.blockers:
        version.blockers.append(
            ReportBlocker(
                description=blocker.description,
                is_key_issue=blocker.is_key_issue,
            )
        )

    for achievement in data.achievements:
        version.achievements.append(
            ReportAchievement(
                description=achievement.description,
                is_key_achievement=achievement.is_key_achievement,
            )
        )

    for entry in data.hours:
        version.hours.append(
            ReportHours(
                task_type=entry.task_type,
                hours=entry.hours,
            )
        )

def create_report(
    db: Session,
    user: User,
    data: WeeklyReportCreate,
) -> WeeklyReport:

    project = db.get(Project, data.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot report against an inactive project",
        )

    clash = db.scalar(
        select(WeeklyReport).where(
            WeeklyReport.user_id == user.user_id,
            WeeklyReport.week_start == data.week_start,
        )
    )

    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"You already have a report for the week starting "
                f"{data.week_start.isoformat()}"
            ),
        )

    report = WeeklyReport(
        user_id=user.user_id,
        project_id=data.project_id,
        week_start=data.week_start,
        week_end=data.week_end,
        status=ReportStatus.DRAFT.value,
        notes=data.notes,
        links=data.links,
    )

    # rule 1: a report always has version 1
    version = ReportVersion(version_number=1)
    report.versions.append(version)

    _replace_children(version, data)

    db.add(report)
    db.commit()

    return get_report(db, report.report_id)


def get_report(db: Session, report_id: int) -> WeeklyReport:
    report = db.scalar(
        select(WeeklyReport)
        .where(WeeklyReport.report_id == report_id)
        .options(*_detail_options())
    )

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report


def update_report(
    db: Session,
    report_id: int,
    user: User,
    data: WeeklyReportUpdate,
) -> WeeklyReport:

    report = get_report(db, report_id)
    assert_can_edit(report, user)

    if data.project_id is not None and data.project_id != report.project_id:
        project = db.get(Project, data.project_id)

        if not project or not project.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or inactive",
            )

        report.project_id = data.project_id

    report.notes = data.notes
    report.links = data.links

    # rule 2: a draft edit mutates the current version in place
    _replace_children(current_version(report), data)

    db.commit()

    return get_report(db, report_id)


def delete_report(
    db: Session,
    report_id: int,
    user: User,
) -> None:
    """Only the owner, and only while it is still a draft."""

    report = get_report(db, report_id)

    if report.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reports",
        )

    if report.status != ReportStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft reports can be deleted",
        )

    db.delete(report)
    db.commit()

def list_reports(
    db: Session,
    *,
    user_id: int | None = None,
    project_id: int | None = None,
    report_status: str | None = None,
    week_start: date | None = None,
    week_from: date | None = None,
    week_to: date | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[WeeklyReport], int]:

    conditions = []

    if user_id is not None:
        conditions.append(WeeklyReport.user_id == user_id)

    if project_id is not None:
        conditions.append(WeeklyReport.project_id == project_id)

    if report_status is not None:
        conditions.append(WeeklyReport.status == report_status)

    if week_start is not None:
        conditions.append(WeeklyReport.week_start == week_start)

    if week_from is not None:
        conditions.append(WeeklyReport.week_start >= week_from)

    if week_to is not None:
        conditions.append(WeeklyReport.week_start <= week_to)

    total = db.scalar(
        select(func.count())
        .select_from(WeeklyReport)
        .where(*conditions)
    ) or 0

    reports = list(
        db.scalars(
            select(WeeklyReport)
            .where(*conditions)
            .options(
                selectinload(WeeklyReport.user),
                selectinload(WeeklyReport.project),
                selectinload(WeeklyReport.versions),
            )
            .order_by(
                WeeklyReport.week_start.desc(),
                WeeklyReport.report_id.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    for report in reports:
        report.current_version_number = (
            report.versions[-1].version_number if report.versions else 1
        )

    return reports, total

def fork_version(
    db: Session,
    report: WeeklyReport,
) -> ReportVersion:

    source = current_version(report)

    next_number = (
        db.scalar(
            select(func.max(ReportVersion.version_number)).where(
                ReportVersion.report_id == report.report_id
            )
        )
        or 0
    ) + 1

    target = ReportVersion(
        report_id=report.report_id,
        version_number=next_number,
    )

    for task in source.tasks:
        target.tasks.append(
            ReportTask(
                task_name=task.task_name,
                priority=task.priority,
                planned_percent=task.planned_percent,
                actual_percent=task.actual_percent,
                status=task.status,
                time_planned=task.time_planned,
                time_spent=task.time_spent,
                deliverable=task.deliverable,
            )
        )

    for item in source.next_week_tasks:
        target.next_week_tasks.append(
            NextWeekTask(
                description=item.description,
                priority=item.priority,
            )
        )

    for blocker in source.blockers:
        target.blockers.append(
            ReportBlocker(
                description=blocker.description,
                is_key_issue=blocker.is_key_issue,
            )
        )

    for achievement in source.achievements:
        target.achievements.append(
            ReportAchievement(
                description=achievement.description,
                is_key_achievement=achievement.is_key_achievement,
            )
        )

    for entry in source.hours:
        target.hours.append(
            ReportHours(
                task_type=entry.task_type,
                hours=entry.hours,
            )
        )

    report.versions.append(target)
    db.flush()

    return target

