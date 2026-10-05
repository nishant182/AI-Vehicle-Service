from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class ServiceHistory(Base):
    __tablename__ = "service_history"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id"),
        nullable=False,
        index=True
    )

    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )

    service_center_id: Mapped[int | None] = mapped_column(
        ForeignKey("service_centers.id"),
        nullable=True,
        index=True
    )

    service_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    mileage: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    cost: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Completed",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )