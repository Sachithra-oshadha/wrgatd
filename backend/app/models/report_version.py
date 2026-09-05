from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportVersion(Base):
    __tablename__ = "report_versions"

    __table_args__ = (
        UniqueConstraint(
            "report_id",
            "version_number",
            name="uq_report_versions_report_number",
        ),
    )

    version_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    report_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_reports.report_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    # relationships
    
    report: Mapped["WeeklyReport"] = relationship(
        back_populates="versions",
    )

    tasks: Mapped[list["ReportTask"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
    )

    next_week_tasks: Mapped[list["NextWeekTask"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
    )

    blockers: Mapped[list["ReportBlocker"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
    )

    achievements: Mapped[list["ReportAchievement"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
    )

    hours: Mapped[list["ReportHours"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
    )
