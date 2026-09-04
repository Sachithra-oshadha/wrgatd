from decimal import Decimal

from sqlalchemy import Numeric, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportHours(Base):
    __tablename__ = "report_hours"
    
    hours_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    
    version_id: Mapped[int] = mapped_column(
        ForeignKey("report_versions.version_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    task_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    
    hours: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
    )