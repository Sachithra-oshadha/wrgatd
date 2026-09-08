from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin, require_manager
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse
from app.schemas.user import (
    UserCreateRequest,
    UserDetailResponse,
    UserListResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)
from app.schemas.dashboard import MemberStats
from app.services import user_service, dashboard_service


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("", response_model=UserListResponse)
def list_users(
    search: str | None = Query(default=None),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    users, total = user_service.list_users(
        db,
        search=search,
        role=role,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
    }

@router.get("/directory", response_model=list[UserResponse])
def directory(
    role: UserRole | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    """Active users, name and email only. Manager-visible."""

    users, _total = user_service.list_users(
        db, role=role, is_active=True, page=1, page_size=500
    )

    return users


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.get_user(db, user_id)


@router.post(
    "",
    response_model=UserDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.create_user(db, data)


@router.patch("/{user_id}", response_model=UserDetailResponse)
def update_user(
    user_id: int,
    data: UserUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.update_user(db, user_id, data)


@router.patch("/{user_id}/role", response_model=UserDetailResponse)
def change_role(
    user_id: int,
    data: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return user_service.change_role(db, user_id, data, current_user)


@router.delete("/{user_id}", response_model=UserDetailResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return user_service.deactivate_user(db, user_id, current_user)

@router.get("/{user_id}/stats", response_model=MemberStats)
def user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        user_id != current_user.user_id
        and current_user.role.value not in ("MANAGER", "ADMIN")
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own statistics",
        )

    user_service.get_user(db, user_id)

    return dashboard_service.member_stats(db, user_id)

