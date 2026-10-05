from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.models.booking import Booking
from backend.models.service import Service
from backend.models.service_history import ServiceHistory
from backend.models.notification import Notification
from backend.routes.auth import get_current_user
from backend.schemas.dashboard import (
    DashboardResponse,
    DashboardBooking,
    DashboardServiceHistory,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total vehicles
    total_vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.user_id == current_user.id)
        .count()
    )

    # Total bookings
    total_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .count()
    )

    # Pending bookings
    pending_bookings = (
        db.query(Booking)
        .filter(
            Booking.user_id == current_user.id,
            Booking.status == "Pending"
        )
        .count()
    )

    # Completed services
    completed_services = (
        db.query(ServiceHistory)
        .filter(
            ServiceHistory.user_id == current_user.id,
            ServiceHistory.status == "Completed"
        )
        .count()
    )

    # Unread notifications
    unread_notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )

    # Recent bookings
    bookings = (
        db.query(Booking, Service, Vehicle)
        .join(Service, Booking.service_id == Service.id)
        .join(Vehicle, Booking.vehicle_id == Vehicle.id)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .limit(5)
        .all()
    )

    recent_bookings = []

    for booking, service, vehicle in bookings:
        recent_bookings.append(
            DashboardBooking(
                id=booking.id,
                service_name=service.name,
                vehicle_name=f"{vehicle.brand} {vehicle.model}",
                booking_date=booking.booking_date,
                booking_time=booking.booking_time.strftime("%H:%M"),
                status=booking.status,
                estimated_price=booking.estimated_price,
            )
        )

    # Recent service history
    history = (
        db.query(ServiceHistory, Service, Vehicle)
        .join(Service, ServiceHistory.service_id == Service.id)
        .join(Vehicle, ServiceHistory.vehicle_id == Vehicle.id)
        .filter(ServiceHistory.user_id == current_user.id)
        .order_by(
            ServiceHistory.service_date.desc(),
            ServiceHistory.id.desc()
        )
        .limit(5)
        .all()
    )

    recent_service_history = []

    for record, service, vehicle in history:
        recent_service_history.append(
            DashboardServiceHistory(
                id=record.id,
                service_name=service.name,
                vehicle_name=f"{vehicle.brand} {vehicle.model}",
                service_date=record.service_date,
                cost=record.cost,
                status=record.status,
            )
        )

    return DashboardResponse(
        total_vehicles=total_vehicles,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        completed_services=completed_services,
        unread_notifications=unread_notifications,
        recent_bookings=recent_bookings,
        recent_service_history=recent_service_history,
    )