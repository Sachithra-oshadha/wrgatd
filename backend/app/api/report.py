from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_manager
from app.core.database import get_db
from app.core.weeks import current_week_bounds
from app.models.user import User
from app.schemas.report import (
    ReportStatus,
    WeeklyReportCreate,
    WeeklyReportListResponse,
    WeeklyReportResponse,
    WeeklyReportUpdate,
    ReviewRequest,
    ReviewCommentResponse,
    VersionHistoryResponse,
)
from app.services import report_service, workflow_service

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

def _review_dict(review, version_number: int) -> dict:
    return {
        "review_id": review.review_id,
        "report_id": review.report_id,
        "version_id": review.version_id,
        "version_number": version_number,
        "action": review.action,
        "comment": review.comment,
        "created_at": review.created_at,
        "reviewer": review.reviewer,
    }


def _to_detail(report) -> dict:

    version = report_service.current_version(report)
    latest = report.reviews[-1] if report.reviews else None

    # read the reviewed version's number rather than letting the schema
    # default to 1 - after a correction the review points at v1 while the
    # current version is v2
    latest_review = (
        _review_dict(latest, latest.version.version_number)
        if latest
        else None
    )

    return {
        "report_id": report.report_id,
        "week_start": report.week_start,
        "week_end": report.week_end,
        "status": report.status,
        "submitted_at": report.submitted_at,
        "approved_at": report.approved_at,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "notes": report.notes,
        "links": report.links,
        "user": report.user,
        "project": report.project,
        "current_version": version,
        "current_version_number": version.version_number,
        "version_count": len(report.versions),
        "latest_review": latest_review,
    }

@router.post(
    "",
    response_model=WeeklyReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_report(
    data: WeeklyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = report_service.create_report(db, current_user, data)

    return _to_detail(report)


@router.get("/my", response_model=WeeklyReportListResponse)
def my_reports(
    project_id: int | None = Query(default=None),
    report_status: ReportStatus | None = Query(default=None, alias="status"),
    week_from: date | None = Query(default=None),
    week_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    reports, total = report_service.list_reports(
        db,
        user_id=current_user.user_id,
        project_id=project_id,
        report_status=report_status.value if report_status else None,
        week_from=week_from,
        week_to=week_to,
        page=page,
        page_size=page_size,
    )

    return {
        "items": reports,
        "total": total,
        "page": page,
        "page_size": page_size,
    }

@router.get("/team", response_model=WeeklyReportListResponse)
def team_reports(
    user_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    report_status: ReportStatus | None = Query(default=None, alias="status"),
    week_start: date | None = Query(default=None),
    week_from: date | None = Query(default=None),
    week_to: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):

    reports, total = report_service.list_reports(
        db,
        user_id=user_id,
        project_id=project_id,
        report_status=report_status.value if report_status else None,
        week_start=week_start,
        week_from=week_from,
        week_to=week_to,
        page=page,
        page_size=page_size,
    )

    return {
        "items": reports,
        "total": total,
        "page": page,
        "page_size": page_size,
    }

@router.get("/current-week")
def current_week():

    start, end = current_week_bounds()

    return {
        "week_start": start,
        "week_end": end,
    }

@router.get("/{report_id}", response_model=WeeklyReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = report_service.get_report(db, report_id)
    report_service.assert_can_read(report, current_user)

    return _to_detail(report)

@router.patch("/{report_id}", response_model=WeeklyReportResponse)
def update_report(
    report_id: int,
    data: WeeklyReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = report_service.update_report(
        db, report_id, current_user, data
    )

    return _to_detail(report)

@router.delete(
    "/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report_service.delete_report(db, report_id, current_user)

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{report_id}/submit", response_model=WeeklyReportResponse)
def submit_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = workflow_service.submit(db, report_id, current_user)

    return _to_detail(report)


@router.post("/{report_id}/approve", response_model=WeeklyReportResponse)
def approve_report(
    report_id: int,
    data: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    report = workflow_service.review(
        db,
        report_id,
        current_user,
        workflow_service.Action.APPROVE,
        data.comment,
    )

    return _to_detail(report)


@router.post(
    "/{report_id}/request-changes",
    response_model=WeeklyReportResponse,
)
def request_changes(
    report_id: int,
    data: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    report = workflow_service.review(
        db,
        report_id,
        current_user,
        workflow_service.Action.REQUEST_CHANGES,
        data.comment,
    )

    return _to_detail(report)

@router.get(
    "/{report_id}/versions",
    response_model=VersionHistoryResponse,
)
def list_versions(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = report_service.get_report(db, report_id)
    report_service.assert_can_read(report, current_user)

    versions = report_service.list_versions(db, report_id)
    reviews = report_service.list_reviews(db, report_id)

    reviews_by_version = {
        review.version_id: review for review in reviews
    }

    current_id = report_service.current_version(report).version_id

    entries = []

    for version in versions:
        review = reviews_by_version.get(version.version_id)

        entries.append(
            {
                "version_id": version.version_id,
                "version_number": version.version_number,
                "submitted_at": version.submitted_at,
                "created_at": version.created_at,
                "is_current": version.version_id == current_id,
                "tasks": version.tasks,
                "next_week_tasks": version.next_week_tasks,
                "blockers": version.blockers,
                "achievements": version.achievements,
                "hours": version.hours,
                "review": (
                    _review_dict(review, version.version_number)
                    if review
                    else None
                ),
            }
        )

    return {
        "report_id": report_id,
        "versions": entries,
    }


@router.get(
    "/{report_id}/reviews",
    response_model=list[ReviewCommentResponse],
)
def list_reviews(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = report_service.get_report(db, report_id)
    report_service.assert_can_read(report, current_user)

    return [
        _review_dict(review, review.version.version_number)
        for review in report_service.list_reviews(db, report_id)
    ]