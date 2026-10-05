from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class ServiceCenter(Base):
    __tablename__ = "service_centers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True
    )

    contact: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    opening_time: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    closing_time: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    rating: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False
    )

    review_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    pricing_info: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )