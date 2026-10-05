from datetime import datetime
from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminStatsResponse(BaseModel):
    total_users: int
    total_vehicles: int
    total_bookings: int
    total_services: int
    total_service_centers: int
    total_notifications: int