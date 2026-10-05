from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    brand: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    registration_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
        nullable=False
    )

    fuel_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    current_mileage: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False
    )

    last_service_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    last_service_km: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    insurance_expiry: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    vehicle_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )