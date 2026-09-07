from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_manager
from app.core.database import get_db
from app.models.user import User
from app.schemas.dashboard import (
    ActivityEvent,
    HoursPoint,
    MemberStats,
    MemberSubmission,
    PersonalSummary,
    TasksTrendPoint,
    TeamSummary,
    WorkloadPoint,
)
from app.services import dashboard_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/me", response_model=PersonalSummary)
def my_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.personal_summary(db, current_user)


@router.get("/team", response_model=TeamSummary)
def team_dashboard(
    week_start: date | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return dashboard_service.team_summary(
        db,
        week_start=week_start,
        project_id=project_id,
    )


@router.get("/tasks-trend", response_model=list[TasksTrendPoint])
def tasks_trend(
    weeks: int = Query(default=8, ge=1, le=52),
    user_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # a team member may only see their own trend
    if not current_user.role.value in ("MANAGER", "ADMIN"):
        user_id = current_user.user_id

    return dashboard_service.tasks_trend(
        db,
        weeks=weeks,
        user_id=user_id,
        project_id=project_id,
    )


@router.get("/workload", response_model=list[WorkloadPoint])
def workload(
    week_start: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return dashboard_service.workload_by_project(db, week_start=week_start)


@router.get("/hours-breakdown", response_model=list[HoursPoint])
def hours_breakdown(
    week_start: date | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.role.value in ("MANAGER", "ADMIN"):
        user_id = current_user.user_id

    return dashboard_service.hours_breakdown(
        db,
        week_start=week_start,
        user_id=user_id,
    )


@router.get("/submissions", response_model=list[MemberSubmission])
def submissions(
    week_start: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return dashboard_service.submission_by_member(db, week_start=week_start)


@router.get("/activity", response_model=list[ActivityEvent])
def activity(
    limit: int = Query(default=15, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return dashboard_service.activity_feed(db, limit=limit)
