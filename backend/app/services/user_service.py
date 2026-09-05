from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreateRequest,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)


def list_users(
    db: Session,
    *,
    search: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:

    conditions = []

    if search:
        pattern = f"%{search.lower()}%"

        conditions.append(
            or_(
                func.lower(User.first_name).like(pattern),
                func.lower(User.last_name).like(pattern),
                func.lower(User.email).like(pattern),
            )
        )

    if role is not None:
        conditions.append(User.role == role)

    if is_active is not None:
        conditions.append(User.is_active.is_(is_active))

    total = db.scalar(
        select(func.count())
        .select_from(User)
        .where(*conditions)
    ) or 0

    users = db.scalars(
        select(User)
        .where(*conditions)
        .order_by(User.first_name, User.last_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(users), total


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


def create_user(db: Session, data: UserCreateRequest) -> User:
    email = data.email.lower()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_user(
    db: Session,
    user_id: int,
    data: UserUpdateRequest,
) -> User:

    user = get_user(db, user_id)
    changes = data.model_dump(exclude_unset=True)

    if "email" in changes:
        email = changes["email"].lower()

        clash = db.scalar(
            select(User).where(
                User.email == email,
                User.user_id != user_id,
            )
        )

        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        changes["email"] = email

    for field in ("first_name", "last_name"):
        if field in changes and changes[field] is not None:
            changes[field] = changes[field].strip()

    for field, value in changes.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def change_role(
    db: Session,
    user_id: int,
    data: UserRoleUpdateRequest,
    acting_user: User,
) -> User:

    if user_id == acting_user.user_id and data.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You cannot remove your own admin role",
        )

    user = get_user(db, user_id)
    user.role = data.role

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(
    db: Session,
    user_id: int,
    acting_user: User,
) -> User:

    if user_id == acting_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You cannot deactivate your own account",
        )

    user = get_user(db, user_id)
    user.is_active = False

    db.commit()
    db.refresh(user)

    return user
