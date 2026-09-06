from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.review_comment import ReviewComments
from app.models.user import User, UserRole
from app.models.weekly_report import WeeklyReport
from app.schemas.report import ReportStatus
from app.services import report_service


class Action:
    SUBMIT = "SUBMIT"
    APPROVE = "APPROVE"
    REQUEST_CHANGES = "REQUEST_CHANGES"

TRANSITIONS: dict[tuple[str, str], str] = {
    (ReportStatus.DRAFT.value, Action.SUBMIT):
        ReportStatus.SUBMITTED.value,
    (ReportStatus.NEEDS_CORRECTION.value, Action.SUBMIT):
        ReportStatus.SUBMITTED.value,
    (ReportStatus.SUBMITTED.value, Action.APPROVE):
        ReportStatus.APPROVED.value,
    (ReportStatus.SUBMITTED.value, Action.REQUEST_CHANGES):
        ReportStatus.NEEDS_CORRECTION.value,
}

def _next_status(report: WeeklyReport, action: str) -> str:
    target = TRANSITIONS.get((report.status, action))

    if target is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot {action.lower().replace('_', ' ')} a report "
                f"with status {report.status}."
            ),
        )

    return target

def submit(
    db: Session,
    report_id: int,
    user: User,
) -> WeeklyReport:

    report = report_service.get_report(db, report_id)

    if report.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own reports",
        )

    target = _next_status(report, Action.SUBMIT)

    _assert_has_content(report)

    now = datetime.now(timezone.utc)

    # No fork here. Requesting changes already created the fresh version
    # the author has been editing, so the reviewed version was frozen
    # before any edit could reach it (Phase 14).
    version = report_service.current_version(report)

    version.submitted_at = now

    report.status = target
    report.submitted_at = now

    db.commit()

    return report_service.get_report(db, report_id)


def _assert_has_content(report: WeeklyReport) -> None:

    version = report_service.current_version(report)

    if not version.tasks and not version.achievements:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Add at least one completed task or achievement "
                "before submitting."
            ),
        )

def review(
    db: Session,
    report_id: int,
    reviewer: User,
    action: str,
    comment: str | None,
) -> WeeklyReport:

    if reviewer.role not in (UserRole.MANAGER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can review reports",
        )

    report = report_service.get_report(db, report_id)

    if report.user_id == reviewer.user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You cannot review your own report",
        )

    target = _next_status(report, action)

    if action == Action.REQUEST_CHANGES and not (comment or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A comment is required when requesting changes",
        )

    version = report_service.current_version(report)

    db.add(
        ReviewComments(
            report_id=report.report_id,
            version_id=version.version_id,
            reviewer_id=reviewer.user_id,
            action=(
                "APPROVED"
                if action == Action.APPROVE
                else "REQUEST_CHANGES"
            ),
            comment=(comment or "").strip() or None,
        )
    )

    report.status = target

    if action == Action.APPROVE:
        report.approved_at = datetime.now(timezone.utc)

    if action == Action.REQUEST_CHANGES:
        # Phase 14: freeze the version the manager just reviewed and give
        # the author a fresh copy to correct. Forking here rather than on
        # resubmission is what keeps the reviewed content immutable - an
        # edit during NEEDS_CORRECTION lands on the new version, never on
        # the one the review points at.
        report_service.fork_version(db, report)

    db.commit()

    return report_service.get_report(db, report_id)

