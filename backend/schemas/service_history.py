from datetime import date

from pydantic import BaseModel, Field


class ServiceHistoryCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    service_center_id: int | None = Field(default=None, gt=0)

    service_date: date
    mileage: float | None = Field(default=None, ge=0)
    cost: float = Field(default=0, ge=0)

    notes: str | None = None


class ServiceHistoryResponse(BaseModel):
    id: int
    user_id: int
    vehicle_id: int
    service_id: int
    service_center_id: int | None

    service_date: date
    mileage: float | None
    cost: float
    notes: str | None
    status: str

    model_config = {
        "from_attributes": True
    }