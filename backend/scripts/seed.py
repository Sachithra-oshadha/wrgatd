"""Populate the database with a realistic demo dataset.

Usage (from backend/, with the venv active):

    python -m scripts.seed          # add data, keep what exists
    python -m scripts.seed --reset  # delete all app data first

Idempotent: rerunning without --reset skips users, projects and weeks
that already exist.
"""

import random
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.core.weeks import monday_of
from app.models.next_week_task import NextWeekTask
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.report_achievement import ReportAchievement
from app.models.report_blocker import ReportBlocker
from app.models.report_hours import ReportHours
from app.models.report_task import ReportTask
from app.models.report_version import ReportVersion
from app.models.review_comment import ReviewComments
from app.models.user import User, UserRole
from app.models.weekly_report import WeeklyReport


random.seed(20260905)  # deterministic - the same demo every run

WEEKS = 8
PASSWORD = "Password123"

PEOPLE = [
    ("Ada", "Admin", "admin@example.com", UserRole.ADMIN),
    ("Sarah", "Kaur", "sarah@example.com", UserRole.MANAGER),
    ("Marcus", "Bell", "marcus@example.com", UserRole.MANAGER),
    ("John", "Doe", "john@example.com", UserRole.TEAM_MEMBER),
    ("Mia", "Chen", "mia@example.com", UserRole.TEAM_MEMBER),
    ("David", "Okafor", "david@example.com", UserRole.TEAM_MEMBER),
    ("Priya", "Nair", "priya@example.com", UserRole.TEAM_MEMBER),
    ("Tom", "Iversen", "tom@example.com", UserRole.TEAM_MEMBER),
    ("Lena", "Fischer", "lena@example.com", UserRole.TEAM_MEMBER),
    ("Sam", "Reyes", "sam@example.com", UserRole.TEAM_MEMBER),
    ("Yuki", "Tanaka", "yuki@example.com", UserRole.TEAM_MEMBER),
]

PROJECTS = [
    ("Client A", "Primary client engagement", True),
    ("Client B", "Secondary client engagement", True),
    ("Internal Tool", "Internal tooling and platform work", True),
    ("R&D", "Research and prototypes", True),
    ("Marketing Site", "Marketing website - paused", False),
]

TASK_NAMES = [
    "Implement the authentication flow",
    "Write integration tests",
    "Refactor the reporting service",
    "Fix the dashboard aggregation query",
    "Review the API contract",
    "Migrate the legacy import job",
    "Add pagination to the project list",
    "Investigate the slow week-start query",
    "Update the deployment runbook",
    "Pair on the versioning design",
]

BLOCKERS = [
    "Waiting on staging credentials from IT",
    "Blocked on the upstream API contract",
    "Test environment is unstable",
    "Waiting on design sign-off",
    "Dependency has an unpatched CVE",
]

ACHIEVEMENTS = [
    "Cut the dashboard load time by 40%",
    "Shipped the correction workflow ahead of schedule",
    "Onboarded a new team member",
    "Closed out the last of the migration backlog",
    "Wrote the runbook the on-call team asked for",
]

HOUR_CATEGORIES = [
    "Development",
    "Testing",
    "Meetings",
    "Documentation",
    "Research",
]

PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
TASK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"]

def reset(db) -> None:
    """Delete all application data. Cascades handle the children."""

    db.execute(delete(ReviewComments))
    db.execute(delete(WeeklyReport))
    db.execute(delete(ProjectMember))
    db.execute(delete(Project))
    db.execute(delete(User))
    db.commit()

    print("Cleared existing data.")


def ensure_users(db) -> list[User]:
    users = []

    for first, last, email, role in PEOPLE:
        user = db.scalar(select(User).where(User.email == email))

        if not user:
            user = User(
                first_name=first,
                last_name=last,
                email=email,
                password_hash=hash_password(PASSWORD),
                role=role,
                is_active=True,
            )
            db.add(user)

        users.append(user)

    db.flush()

    return users


def ensure_projects(db) -> list[Project]:
    projects = []

    for name, description, is_active in PROJECTS:
        project = db.scalar(select(Project).where(Project.name == name))

        if not project:
            project = Project(
                name=name,
                description=description,
                is_active=is_active,
            )
            db.add(project)

        projects.append(project)

    db.flush()

    return projects


def assign_members(db, users: list[User], projects: list[Project]) -> None:
    members = [u for u in users if u.role == UserRole.TEAM_MEMBER]
    active = [p for p in projects if p.is_active]

    for index, member in enumerate(members):
        chosen = {active[index % len(active)]}

        if index % 3 == 0:
            chosen.add(active[(index + 1) % len(active)])

        for project in chosen:
            existing = db.scalar(
                select(ProjectMember).where(
                    ProjectMember.user_id == member.user_id,
                    ProjectMember.project_id == project.project_id,
                )
            )

            if not existing:
                db.add(
                    ProjectMember(
                        user_id=member.user_id,
                        project_id=project.project_id,
                    )
                )

    db.flush()


def fill_version(version: ReportVersion, pr_number: int) -> None:
    """Attach a realistic set of children to a version."""

    for _ in range(random.randint(2, 5)):
        actual = Decimal(random.choice([25, 50, 75, 90, 100]))

        version.tasks.append(
            ReportTask(
                task_name=random.choice(TASK_NAMES),
                priority=random.choice(PRIORITIES),
                planned_percent=Decimal(random.choice([50, 75, 100])),
                actual_percent=actual,
                status=(
                    "COMPLETED"
                    if actual == 100
                    else random.choice(TASK_STATUSES[:2])
                ),
                time_planned=Decimal(random.randint(2, 16)),
                time_spent=Decimal(random.randint(2, 18)),
                deliverable=f"PR #{pr_number}",
            )
        )

    for _ in range(random.randint(1, 3)):
        version.next_week_tasks.append(
            NextWeekTask(
                description=random.choice(TASK_NAMES),
                priority=random.choice(PRIORITIES),
            )
        )

    for index, description in enumerate(
        random.sample(BLOCKERS, random.randint(0, 2))
    ):
        version.blockers.append(
            ReportBlocker(
                description=description,
                is_key_issue=(index == 0),
            )
        )

    for index, description in enumerate(
        random.sample(ACHIEVEMENTS, random.randint(1, 2))
    ):
        version.achievements.append(
            ReportAchievement(
                description=description,
                is_key_achievement=(index == 0),
            )
        )

    for category in random.sample(HOUR_CATEGORIES, random.randint(3, 5)):
        version.hours.append(
            ReportHours(
                task_type=category,
                hours=Decimal(random.randint(1, 16)),
            )
        )

def make_reports(
    db,
    users: list[User],
    projects: list[Project],
) -> None:

    members = [u for u in users if u.role == UserRole.TEAM_MEMBER]
    managers = [
        u for u in users
        if u.role in (UserRole.MANAGER, UserRole.ADMIN)
    ]
    active_projects = [p for p in projects if p.is_active]

    this_monday = monday_of(date.today())
    pr_number = 100

    for week_offset in range(WEEKS - 1, -1, -1):
        week_start = this_monday - timedelta(weeks=week_offset)
        week_end = week_start + timedelta(days=6)
        is_current_week = week_offset == 0

        for index, member in enumerate(members):
            # leave a couple of people with nothing this week so the
            # dashboard has NOT_STARTED and LATE rows to show
            if random.random() < (0.25 if is_current_week else 0.1):
                continue

            existing = db.scalar(
                select(WeeklyReport).where(
                    WeeklyReport.user_id == member.user_id,
                    WeeklyReport.week_start == week_start,
                )
            )

            if existing:
                continue

            # older weeks settle into APPROVED; recent weeks vary
            if week_offset >= 3:
                status = "APPROVED"
            elif is_current_week:
                status = random.choice(
                    ["DRAFT", "DRAFT", "SUBMITTED", "APPROVED"]
                )
            else:
                status = random.choice(
                    ["SUBMITTED", "APPROVED", "NEEDS_CORRECTION", "APPROVED"]
                )

            project = active_projects[
                (index + week_offset) % len(active_projects)
            ]

            submitted_at = (
                datetime.combine(week_end, datetime.min.time())
                .replace(tzinfo=timezone.utc)
                + timedelta(hours=random.randint(9, 18))
            )

            report = WeeklyReport(
                user_id=member.user_id,
                project_id=project.project_id,
                week_start=week_start,
                week_end=week_end,
                status=status,
                notes=random.choice(
                    [None, "Steady week.", "Lost a day to the incident."]
                ),
                links=None,
                submitted_at=(
                    None if status == "DRAFT" else submitted_at
                ),
                approved_at=(
                    submitted_at + timedelta(days=1)
                    if status == "APPROVED"
                    else None
                ),
            )

            version = ReportVersion(
                version_number=1,
                submitted_at=(
                    None if status == "DRAFT" else submitted_at
                ),
            )

            pr_number += 1
            fill_version(version, pr_number)
            report.versions.append(version)

            db.add(report)
            db.flush()

            reviewer = random.choice(managers)

            if status == "NEEDS_CORRECTION":
                db.add(
                    ReviewComments(
                        report_id=report.report_id,
                        version_id=version.version_id,
                        reviewer_id=reviewer.user_id,
                        action="REQUEST_CHANGES",
                        comment=(
                            "Please provide actual completion percentages "
                            "for the testing tasks."
                        ),
                        created_at=submitted_at + timedelta(hours=6),
                    )
                )

            elif status == "APPROVED":
                # roughly a third of approvals went through a correction
                # round first - that is what gives the demo two versions
                if random.random() < 0.35:
                    db.add(
                        ReviewComments(
                            report_id=report.report_id,
                            version_id=version.version_id,
                            reviewer_id=reviewer.user_id,
                            action="REQUEST_CHANGES",
                            comment="Please update the testing hours.",
                            created_at=submitted_at + timedelta(hours=6),
                        )
                    )

                    version_two = ReportVersion(
                        report_id=report.report_id,
                        version_number=2,
                        submitted_at=submitted_at + timedelta(hours=20),
                    )

                    pr_number += 1
                    fill_version(version_two, pr_number)

                    db.add(version_two)
                    db.flush()

                    db.add(
                        ReviewComments(
                            report_id=report.report_id,
                            version_id=version_two.version_id,
                            reviewer_id=reviewer.user_id,
                            action="APPROVED",
                            comment="Updated report is satisfactory.",
                            created_at=submitted_at + timedelta(hours=26),
                        )
                    )

                else:
                    db.add(
                        ReviewComments(
                            report_id=report.report_id,
                            version_id=version.version_id,
                            reviewer_id=reviewer.user_id,
                            action="APPROVED",
                            comment=None,
                            created_at=submitted_at + timedelta(hours=8),
                        )
                    )

    db.commit()


def main() -> int:
    db = SessionLocal()

    try:
        if "--reset" in sys.argv:
            reset(db)

        users = ensure_users(db)
        projects = ensure_projects(db)
        assign_members(db, users, projects)
        make_reports(db, users, projects)

        report_count = len(db.scalars(select(WeeklyReport)).all())

        print(
            f"Seeded {len(users)} users, {len(projects)} projects "
            f"and {report_count} reports."
        )
        print(f"All accounts use the password: {PASSWORD}")
        print("Sign in as admin@example.com / sarah@example.com / john@example.com")

        return 0

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
