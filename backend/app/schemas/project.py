from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.auth import UserResponse


class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Project name cannot be blank")

        return cleaned


class ProjectUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=5000)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Project name cannot be blank")

        return cleaned


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    name: str
    description: str | None
    is_active: bool
    member_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_member_id: int
    project_id: int
    user: UserResponse
    assigned_at: datetime


class ProjectMemberCreateRequest(BaseModel):
    user_id: int
