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
)
from app.services import report_service

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

def _to_detail(report) -> dict:

    version = report_service.current_version(report)

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
