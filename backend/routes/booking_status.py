from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.booking import Booking
from backend.models.notification import Notification
from backend.models.service import Service
from backend.models.service_history import ServiceHistory
from backend.models.vehicle import Vehicle
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

    old_status = booking.status
    booking.status = data.status

    if old_status != data.status:
        db.add(
            Notification(
                user_id=booking.user_id,
                title="Booking Status Updated",
                message=f"Booking #{booking.id} is now {data.status}.",
                notification_type="Booking",
                is_read=False,
            )
        )

    if old_status != "Completed" and data.status == "Completed":
        vehicle = (
            db.query(Vehicle)
            .filter(Vehicle.id == booking.vehicle_id)
            .first()
        )
        service = (
            db.query(Service)
            .filter(Service.id == booking.service_id)
            .first()
        )

        if vehicle and service:
            existing_history = (
                db.query(ServiceHistory)
                .filter(
                    ServiceHistory.user_id == booking.user_id,
                    ServiceHistory.vehicle_id == booking.vehicle_id,
                    ServiceHistory.service_id == booking.service_id,
                    ServiceHistory.service_date == booking.booking_date,
                    ServiceHistory.service_center_id == booking.service_center_id,
                )
                .first()
            )

            if not existing_history:
                db.add(
                    ServiceHistory(
                        user_id=booking.user_id,
                        vehicle_id=booking.vehicle_id,
                        service_id=booking.service_id,
                        service_center_id=booking.service_center_id,
                        service_date=booking.booking_date,
                        mileage=vehicle.current_mileage,
                        cost=booking.estimated_price or 0,
                        notes=booking.notes,
                        status="Completed",
                    )
                )

    db.commit()
    db.refresh(booking)

    return booking