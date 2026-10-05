from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.booking import Booking
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.booking import BookingStatusUpdate, BookingResponse


router = APIRouter(
    prefix="/booking-status",
    tags=["Booking Status"]
)


ALLOWED_STATUSES = {
    "Pending",
    "Confirmed",
    "In Progress",
    "Completed",
    "Cancelled",
}


@router.put(
    "/{booking_id}",
    response_model=BookingResponse
)
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin can change booking status
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update booking status"
        )

    if data.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking status"
        )

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    booking.status = data.status

    db.commit()
    db.refresh(booking)

    return booking