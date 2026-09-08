from datetime import date, timedelta

from groq import Groq, APIStatusError, APIConnectionError, RateLimitError
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.weeks import monday_of
from app.models.report_version import ReportVersion
from app.models.weekly_report import WeeklyReport


MODEL = "qwen/qwen3.6-27b"

SYSTEM_PROMPT = """You are the team assistant for a weekly report system.

You answer a manager's questions using only the report data provided in
the user message. Rules:

- Ground every claim in the data. If the data does not answer the
  question, say so plainly rather than guessing.
- Quote concrete numbers - task counts, hours, percentages - when they
  are available.
- Be concise. A manager is scanning, not reading.
- Never invent a person, project, task or number that is not present.
"""


def _recent_reports(
    db: Session,
    *,
    weeks: int = 4,
) -> list[WeeklyReport]:
    """Every report from the last N weeks, with its current version."""

    earliest = monday_of(date.today()) - timedelta(weeks=weeks - 1)

    return list(
        db.scalars(
            select(WeeklyReport)
            .where(
                WeeklyReport.week_start >= earliest,
                WeeklyReport.status != "DRAFT",
            )
            .options(
                selectinload(WeeklyReport.user),
                selectinload(WeeklyReport.project),
                selectinload(WeeklyReport.versions).selectinload(
                    ReportVersion.tasks
                ),
                selectinload(WeeklyReport.versions).selectinload(
                    ReportVersion.blockers
                ),
                selectinload(WeeklyReport.versions).selectinload(
                    ReportVersion.achievements
                ),
                selectinload(WeeklyReport.versions).selectinload(
                    ReportVersion.hours
                ),
            )
            .order_by(
                WeeklyReport.week_start.desc(),
                WeeklyReport.report_id,
            )
        ).all()
    )


def build_context(db: Session, *, weeks: int = 4) -> str:
    """Render the reports as compact text for the model."""

    reports = _recent_reports(db, weeks=weeks)

    if not reports:
        return "No submitted reports in the selected period."

    lines: list[str] = []

    for report in reports:
        version = report.versions[-1]

        lines.append(
            f"\n### {report.user.first_name} {report.user.last_name} "
            f"- {report.project.name} "
            f"- week of {report.week_start.isoformat()} "
            f"- status {report.status}"
        )

        if version.tasks:
            lines.append("Tasks:")
            for task in version.tasks:
                actual = (
                    f"{task.actual_percent}%"
                    if task.actual_percent is not None
                    else "n/a"
                )
                lines.append(
                    f"- {task.task_name} "
                    f"[{task.priority}, {task.status}, {actual} complete, "
                    f"{task.time_spent or 0}h spent]"
                )

        if version.achievements:
            lines.append("Achievements:")
            for item in version.achievements:
                marker = " (key)" if item.is_key_achievement else ""
                lines.append(f"- {item.description}{marker}")

        if version.blockers:
            lines.append("Blockers:")
            for item in version.blockers:
                marker = " (key)" if item.is_key_issue else ""
                lines.append(f"- {item.description}{marker}")

        if version.hours:
            hours = ", ".join(
                f"{entry.task_type} {entry.hours}h"
                for entry in version.hours
            )
            lines.append(f"Hours: {hours}")

    return "\n".join(lines)

def ask(db: Session, question: str, *, weeks: int = 4) -> str:
    if not settings.assistant_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is not enabled.",
        )

    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is not configured.",
        )

    context = build_context(db, weeks=weeks)

    client = Groq(api_key=settings.groq_api_key)

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=1000,
            reasoning_effort="none",
            temperature=0.7,
            top_p=0.8,
            presence_penalty=1.5,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Report data for the last {weeks} weeks:\n"
                        f"{context}\n\n"
                        f"Question: {question}"
                    ),
                },
            ],
        )

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="The assistant is busy right now. Try again in a moment.",
        )

    except APIStatusError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The assistant is unavailable ({error.status_code}).",
        )

    except APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the assistant service.",
        )

    choice = response.choices[0]

    if choice.finish_reason == "content_filter":
        return (
            "I was not able to answer that question. "
            "Try rephrasing it around the report data."
        )

    return (choice.message.content or "").strip()