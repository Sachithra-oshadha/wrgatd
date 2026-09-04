from datetime import datetime, timezone

from sqlalchemy import Text, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class ReviewComments(Base):
    __tablename__ = "review_comments"
    
    review_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    
    report_id: Mapped[int] = mapped_column(
        ForeignKey("weekly_reports.report_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    version_id: Mapped[int] = mapped_column(
        ForeignKey("report_versions.version_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    action: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )