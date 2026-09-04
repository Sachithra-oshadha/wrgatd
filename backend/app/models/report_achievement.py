from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReportAchievement(Base):
    __tablename__ = "report_achievements"

    achievement_id: Mapped[int] = mapped_column(
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

    is_key_achievement: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )