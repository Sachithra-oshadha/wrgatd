from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.auth import UserResponse
from app.schemas.project import ProjectResponse

class ReportStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    NEEDS_CORRECTION = "NEEDS_CORRECTION"
    APPROVED = "APPROVED"

class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TaskStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class TaskCreate(BaseModel):
    task_name: str = Field(min_length=1, max_length=255)
    priority: Priority = Priority.MEDIUM
    planned_percent: Decimal | None = Field(default=None, ge=0, le=100)
    actual_percent: Decimal | None = Field(default=None, ge=0, le=100)
    status: TaskStatus = TaskStatus.NOT_STARTED
    time_planned: Decimal | None = Field(default=None, ge=0, le=999)
    time_spent: Decimal | None = Field(default=None, ge=0, le=999)
    deliverable: str | None = Field(default=None, max_length=2000)

    @field_validator("task_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Task name cannot be blank")

        return cleaned

class NextWeekTaskCreate(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    priority: Priority = Priority.MEDIUM

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Description cannot be blank")

        return cleaned

class BlockerCreate(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    is_key_issue: bool = False

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Description cannot be blank")

        return cleaned

class AchievementCreate(BaseModel):
    description: str = Field(min_length=1, max_length=2000)
    is_key_achievement: bool = False

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Description cannot be blank")

        return cleaned

class HoursCreate(BaseModel):
    task_type: str = Field(min_length=1, max_length=100)
    hours: Decimal = Field(ge=0, le=168)

    @field_validator("task_type")
    @classmethod
    def strip_type(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Category cannot be blank")

        return cleaned

class _ReportContentMixin(BaseModel):
    """Shared validation for the repeatable sections."""

    tasks: list[TaskCreate] = Field(default_factory=list, max_length=50)
    next_week_tasks: list[NextWeekTaskCreate] = Field(
        default_factory=list, max_length=50
    )
    blockers: list[BlockerCreate] = Field(default_factory=list, max_length=20)
    achievements: list[AchievementCreate] = Field(
        default_factory=list, max_length=20
    )
    hours: list[HoursCreate] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def check_single_key_items(self):
        key_blockers = sum(1 for b in self.blockers if b.is_key_issue)

        if key_blockers > 1:
            raise ValueError(
                "Only one blocker can be marked as the key issue"
            )

        key_achievements = sum(
            1 for a in self.achievements if a.is_key_achievement
        )

        if key_achievements > 1:
            raise ValueError(
                "Only one achievement can be marked as the key achievement"
            )

        return self

    @model_validator(mode="after")
    def check_unique_hour_categories(self):
        seen = set()

        for entry in self.hours:
            key = entry.task_type.lower()

            if key in seen:
                raise ValueError(
                    f"Duplicate hours category: {entry.task_type}"
                )

            seen.add(key)

        return self


class WeeklyReportCreate(_ReportContentMixin):
    project_id: int
    week_start: date
    week_end: date
    notes: str | None = Field(default=None, max_length=5000)
    links: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def check_week_range(self):
        if self.week_start >= self.week_end:
            raise ValueError("week_start must be before week_end")

        if self.week_start.weekday() != 0:
            raise ValueError("week_start must be a Monday")

        if (self.week_end - self.week_start).days != 6:
            raise ValueError("A reporting week must span exactly 7 days")

        return self


class WeeklyReportUpdate(_ReportContentMixin):
    project_id: int | None = None
    notes: str | None = Field(default=None, max_length=5000)
    links: str | None = Field(default=None, max_length=2000)

class TaskResponse(TaskCreate):
    model_config = ConfigDict(from_attributes=True)

    task_id: int


class NextWeekTaskResponse(NextWeekTaskCreate):
    model_config = ConfigDict(from_attributes=True)

    next_task_id: int


class BlockerResponse(BlockerCreate):
    model_config = ConfigDict(from_attributes=True)

    blocker_id: int


class AchievementResponse(AchievementCreate):
    model_config = ConfigDict(from_attributes=True)

    achievement_id: int


class HoursResponse(HoursCreate):
    model_config = ConfigDict(from_attributes=True)

    hours_id: int


class ReportVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    version_id: int
    version_number: int
    submitted_at: datetime | None
    created_at: datetime

    tasks: list[TaskResponse] = Field(default_factory=list)
    next_week_tasks: list[NextWeekTaskResponse] = Field(default_factory=list)
    blockers: list[BlockerResponse] = Field(default_factory=list)
    achievements: list[AchievementResponse] = Field(default_factory=list)
    hours: list[HoursResponse] = Field(default_factory=list)


class WeeklyReportSummary(BaseModel):
    """Row shape for list views - no children, so lists stay cheap."""

    model_config = ConfigDict(from_attributes=True)

    report_id: int
    week_start: date
    week_end: date
    status: ReportStatus
    submitted_at: datetime | None
    approved_at: datetime | None
    updated_at: datetime

    user: UserResponse
    project: ProjectResponse
    current_version_number: int = 1


class WeeklyReportResponse(WeeklyReportSummary):
    notes: str | None = None
    links: str | None = None
    created_at: datetime

    current_version: ReportVersionResponse
    version_count: int = 1


class WeeklyReportListResponse(BaseModel):
    items: list[WeeklyReportSummary]
    total: int
    page: int
    page_size: int
