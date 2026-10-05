from datetime import date, datetime, time

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class Booking(Base):
    __tablename__ = "bookings"

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

    service_center_id: Mapped[int] = mapped_column(
        ForeignKey("service_centers.id"),
        nullable=False,
        index=True
    )

    booking_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    booking_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    estimated_price: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )