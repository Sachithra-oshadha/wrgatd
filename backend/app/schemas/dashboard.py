from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.report import WeeklyReportSummary


class PersonalSummary(BaseModel):
    week_start: date
    week_end: date
    current_week_report: WeeklyReportSummary | None
    total_reports: int
    draft_count: int
    submitted_count: int
    needs_correction_count: int
    approved_count: int
    approval_rate: float
    needs_correction_reports: list[WeeklyReportSummary]


class TeamSummary(BaseModel):
    week_start: date
    week_end: date
    expected_reports: int
    submitted_count: int
    draft_count: int
    approved_count: int
    needs_correction_count: int
    awaiting_review_count: int
    not_started_count: int
    compliance_percent: float
    open_blockers: int


class TasksTrendPoint(BaseModel):
    week_start: date
    completed_tasks: int


class WorkloadPoint(BaseModel):
    project: str
    hours: float
    report_count: int


class HoursPoint(BaseModel):
    task_type: str
    hours: float


class MemberSubmission(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    report_id: int | None
    project: str | None
    status: str


class ActivityEvent(BaseModel):
    report_id: int
    at: datetime
    kind: str
    actor: str


class MemberStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_reports: int
    submitted_count: int
    approved_count: int
    needs_correction_count: int
    draft_count: int
    expected_reports: int
    compliance_percent: float
