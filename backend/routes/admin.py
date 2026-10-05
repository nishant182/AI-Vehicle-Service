from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.models.booking import Booking
from backend.models.service import Service
from backend.models.service_center import ServiceCenter
from backend.models.notification import Notification

from backend.routes.auth import get_current_user
from backend.schemas.admin import (
    AdminUserResponse,
    AdminStatsResponse,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


@router.get("/users", response_model=list[AdminUserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return {
        "total_users": db.query(User).count(),
        "total_vehicles": db.query(Vehicle).count(),
        "total_bookings": db.query(Booking).count(),
        "total_services": db.query(Service).count(),
        "total_service_centers": db.query(ServiceCenter).count(),
        "total_notifications": db.query(Notification).count(),
    }