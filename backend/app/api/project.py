from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_manager
from app.core.database import get_db
from app.models.user import User
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectMemberCreateRequest,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.services import project_service


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.get("", response_model=ProjectListResponse)
def list_projects(
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):

    projects, total = project_service.list_projects(
        db,
        search=search,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )

    return {
        "items": projects,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return project_service.create_project(db, data)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return project_service.get_project(db, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return project_service.update_project(db, project_id, data)


@router.delete("/{project_id}", response_model=ProjectResponse)
def deactivate_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return project_service.deactivate_project(db, project_id)


@router.get(
    "/{project_id}/members",
    response_model=list[ProjectMemberResponse],
)
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return project_service.list_members(db, project_id)


@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    project_id: int,
    data: ProjectMemberCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    return project_service.add_member(db, project_id, data)


@router.delete(
    "/{project_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    project_service.remove_member(db, project_id, user_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
