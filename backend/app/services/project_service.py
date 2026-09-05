from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.models.weekly_report import WeeklyReport
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectMemberCreateRequest,
    ProjectUpdateRequest,
)


def _attach_member_counts(
    db: Session,
    projects: list[Project],
) -> list[Project]:

    if not projects:
        return projects

    ids = [p.project_id for p in projects]

    rows = db.execute(
        select(
            ProjectMember.project_id,
            func.count(ProjectMember.project_member_id),
        )
        .where(ProjectMember.project_id.in_(ids))
        .group_by(ProjectMember.project_id)
    ).all()

    counts = {project_id: count for project_id, count in rows}

    for project in projects:
        project.member_count = counts.get(project.project_id, 0)

    return projects


def list_projects(
    db: Session,
    *,
    search: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Project], int]:

    conditions = []

    if search:
        conditions.append(
            func.lower(Project.name).like(f"%{search.lower()}%")
        )

    if is_active is not None:
        conditions.append(Project.is_active.is_(is_active))

    total = db.scalar(
        select(func.count())
        .select_from(Project)
        .where(*conditions)
    ) or 0

    projects = list(
        db.scalars(
            select(Project)
            .where(*conditions)
            .order_by(Project.is_active.desc(), Project.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    return _attach_member_counts(db, projects), total


def get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    _attach_member_counts(db, [project])

    return project

def create_project(
    db: Session,
    data: ProjectCreateRequest,
) -> Project:

    existing = db.scalar(
        select(Project).where(
            func.lower(Project.name) == data.name.lower()
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A project with this name already exists",
        )

    project = Project(
        name=data.name,
        description=data.description,
        is_active=True,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    project.member_count = 0

    return project


def update_project(
    db: Session,
    project_id: int,
    data: ProjectUpdateRequest,
) -> Project:

    project = get_project(db, project_id)
    changes = data.model_dump(exclude_unset=True)

    if "name" in changes and changes["name"] is not None:
        clash = db.scalar(
            select(Project).where(
                func.lower(Project.name) == changes["name"].lower(),
                Project.project_id != project_id,
            )
        )

        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A project with this name already exists",
            )

    for field, value in changes.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    _attach_member_counts(db, [project])

    return project


def deactivate_project(db: Session, project_id: int) -> Project:

    project = get_project(db, project_id)

    report_count = db.scalar(
        select(func.count())
        .select_from(WeeklyReport)
        .where(WeeklyReport.project_id == project_id)
    ) or 0

    if report_count == 0:
        db.delete(project)
        db.commit()

        return project

    project.is_active = False

    db.commit()
    db.refresh(project)

    _attach_member_counts(db, [project])

    return project


def list_members(db: Session, project_id: int) -> list[ProjectMember]:
    get_project(db, project_id)

    return list(
        db.scalars(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .options(selectinload(ProjectMember.user))
            .join(User, User.user_id == ProjectMember.user_id)
            .order_by(User.first_name, User.last_name)
        ).all()
    )


def add_member(
    db: Session,
    project_id: int,
    data: ProjectMemberCreateRequest,
) -> ProjectMember:

    get_project(db, project_id)

    user = db.get(User, data.user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot assign an inactive user",
        )

    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == data.user_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this project",
        )

    membership = ProjectMember(
        project_id=project_id,
        user_id=data.user_id,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


def remove_member(
    db: Session,
    project_id: int,
    user_id: int,
) -> None:

    membership = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )

    db.delete(membership)
    db.commit()
