from datetime import date, time

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    service_center_id: int = Field(gt=0)
    booking_date: date
    booking_time: time
    notes: str | None = None


class BookingUpdate(BaseModel):
    booking_date: date | None = None
    booking_time: time | None = None
    notes: str | None = None
    status: str | None = None


class BookingStatusUpdate(BaseModel):
    status: str


class BookingResponse(BaseModel):
    id: int
    user_id: int
    vehicle_id: int
    service_id: int
    service_center_id: int
    booking_date: date
    booking_time: time
    estimated_price: float
    status: str
    notes: str | None

    model_config = {
        "from_attributes": True
    }