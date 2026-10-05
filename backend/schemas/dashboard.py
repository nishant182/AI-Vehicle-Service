from datetime import date
from pydantic import BaseModel


class DashboardBooking(BaseModel):
    id: int
    service_name: str
    vehicle_name: str
    booking_date: date
    booking_time: str
    status: str
    estimated_price: float


class DashboardServiceHistory(BaseModel):
    id: int
    service_name: str
    vehicle_name: str
    service_date: date
    cost: float
    status: str


class DashboardResponse(BaseModel):
    total_vehicles: int
    total_bookings: int
    pending_bookings: int
    completed_services: int
    unread_notifications: int

    recent_bookings: list[DashboardBooking]
    recent_service_history: list[DashboardServiceHistory]