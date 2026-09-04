from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NextWeekTask(Base):
    __tablename__ = "next_week_tasks"

    next_task_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    version_id: Mapped[int] = mapped_column(
        ForeignKey("report_versions.version_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM",
    )