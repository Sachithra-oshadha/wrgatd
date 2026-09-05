from sqlalchemy import Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportBlocker(Base):
    __tablename__ = "report_blockers"

    blocker_id: Mapped[int] = mapped_column(
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

    is_key_issue: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    
    # relationship
        
    version: Mapped["ReportVersion"] = relationship(
        back_populates="blockers",
    )