from decimal import Decimal

from sqlalchemy import Numeric, Text, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class ReportTask(Base):
    __tablename__ = "report_tasks"
    
    task_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    
    version_id: Mapped[int] = mapped_column(
        ForeignKey("report_versions.version_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    task_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Medium"
    )
    
    planned_percent: Mapped[Decimal | None] = mapped_column(
        Numeric(5,2),
        nullable=True,
    )
    
    actual_percent: Mapped[Decimal | None] = mapped_column(
        Numeric(5,2),
        nullable=True,
    )
    
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Not Started"
    )
    
    time_planned: Mapped[Decimal | None] = mapped_column(
        Numeric(6,2),
        nullable=True,
    )
    
    time_spent: Mapped[Decimal | None] = mapped_column(
        Numeric(6,2),
        nullable=True,
    )
    
    deliverable: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )