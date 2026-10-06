from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.booking import Booking
from backend.models.service import Service
from backend.models.service_center import ServiceCenter
from backend.models.service_center_service import service_center_services
from backend.models.service_history import ServiceHistory
from backend.models.notification import Notification
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
)


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


# ============================================================
# CREATE BOOKING
# ============================================================

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check vehicle belongs to current user
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == data.vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Check service
    service = db.query(Service).filter(
        Service.id == data.service_id,
        Service.is_active == True
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    # Check service center
    service_center = db.query(ServiceCenter).filter(
        ServiceCenter.id == data.service_center_id,
        ServiceCenter.is_active == True
    ).first()

    if not service_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service center not found"
        )

    # Check whether service is available at this center
    available_service = db.execute(
        service_center_services.select().where(
            service_center_services.c.service_center_id
            == data.service_center_id,
            service_center_services.c.service_id
            == data.service_id
        )
    ).first()

    if not available_service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected service is not available at this service center"
        )

    # Prevent booking in the past
    if data.booking_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking date cannot be in the past"
        )

    # Create booking
    booking = Booking(
        user_id=current_user.id,
        vehicle_id=data.vehicle_id,
        service_id=data.service_id,
        service_center_id=data.service_center_id,
        booking_date=data.booking_date,
        booking_time=data.booking_time,
        estimated_price=service.base_price,
        status="Pending",
        notes=data.notes
    )

    db.add(booking)
    db.flush()

    db.add(
        Notification(
            user_id=current_user.id,
            title="Booking Created",
            message=(
                f"Your booking #{booking.id} has been created successfully."
            ),
            notification_type="Booking",
            is_read=False,
        )
    )

    db.commit()
    db.refresh(booking)

    return booking


# ============================================================
# GET MY BOOKINGS
# ============================================================

@router.get(
    "",
    response_model=list[BookingResponse]
)
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).order_by(
        Booking.booking_date.desc(),
        Booking.booking_time.desc()
    ).all()

    return bookings


# ============================================================
# GET SINGLE BOOKING
# ============================================================

@router.get(
    "/{booking_id}",
    response_model=BookingResponse
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    return booking


# ============================================================
# UPDATE BOOKING
# ============================================================

@router.put(
    "/{booking_id}",
    response_model=BookingResponse
)
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    # Completed/cancelled bookings should not be edited
    if booking.status in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking cannot be modified"
        )

    update_data = data.model_dump(exclude_unset=True)

    # Users may cancel a booking from this endpoint, but only admins
    # can move a booking through Confirmed/In Progress/Completed.
    if "status" in update_data:
        if update_data["status"] != "Cancelled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can change booking workflow status"
            )

    # Validate booking date
    if "booking_date" in update_data:
        if update_data["booking_date"] < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking date cannot be in the past"
            )

    # Store old status before updating
    old_status = booking.status

    # Apply booking updates
    for field, value in update_data.items():
        setattr(booking, field, value)

    # ========================================================
    # AUTO CREATE SERVICE HISTORY WHEN BOOKING IS COMPLETED
    # ========================================================

    if (
        old_status != "Completed"
        and booking.status == "Completed"
    ):

        # Get vehicle
        vehicle = db.query(Vehicle).filter(
            Vehicle.id == booking.vehicle_id,
            Vehicle.user_id == current_user.id
        ).first()

        # Get service
        service = db.query(Service).filter(
            Service.id == booking.service_id
        ).first()

        # Get service center
        service_center = db.query(ServiceCenter).filter(
            ServiceCenter.id == booking.service_center_id
        ).first()

        if vehicle and service:

            # Prevent duplicate history records
            existing_history = db.query(ServiceHistory).filter(
                ServiceHistory.user_id == current_user.id,
                ServiceHistory.vehicle_id == booking.vehicle_id,
                ServiceHistory.service_id == booking.service_id,
                ServiceHistory.service_date == booking.booking_date,
                ServiceHistory.service_center_id == booking.service_center_id
            ).first()

            if not existing_history:

                service_history = ServiceHistory(
                    user_id=current_user.id,
                    vehicle_id=booking.vehicle_id,
                    service_id=booking.service_id,
                    service_center_id=booking.service_center_id,
                    service_date=booking.booking_date,
                    mileage=vehicle.current_mileage,
                    cost=booking.estimated_price or 0,
                    notes=booking.notes,
                    status="Completed"
                )

                db.add(service_history)

    db.commit()
    db.refresh(booking)

    return booking


# ============================================================
# CANCEL BOOKING
# ============================================================

@router.delete(
    "/{booking_id}"
)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )

    if booking.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed booking cannot be cancelled"
        )

    if booking.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )

    booking.status = "Cancelled"

    db.add(
        Notification(
            user_id=current_user.id,
            title="Booking Cancelled",
            message=f"Your booking #{booking.id} has been cancelled.",
            notification_type="Booking",
            is_read=False,
        )
    )

    db.commit()

    return {
        "success": True,
        "message": "Booking cancelled successfully"
    }