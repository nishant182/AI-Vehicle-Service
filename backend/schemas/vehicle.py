from datetime import date

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    vehicle_type: str = Field(min_length=2, max_length=50)
    brand: str = Field(min_length=2, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1900, le=2100)
    registration_number: str = Field(min_length=2, max_length=30)
    fuel_type: str = Field(min_length=2, max_length=30)

    current_mileage: float = Field(
        default=0,
        ge=0
    )

    last_service_date: date | None = None
    last_service_km: float | None = Field(
        default=None,
        ge=0
    )

    insurance_expiry: date | None = None
    vehicle_image: str | None = None


class VehicleUpdate(BaseModel):
    vehicle_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    brand: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    model: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    year: int | None = Field(
        default=None,
        ge=1900,
        le=2100
    )

    registration_number: str | None = Field(
        default=None,
        min_length=2,
        max_length=30
    )

    fuel_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=30
    )

    current_mileage: float | None = Field(
        default=None,
        ge=0
    )

    last_service_date: date | None = None
    last_service_km: float | None = Field(
        default=None,
        ge=0
    )

    insurance_expiry: date | None = None
    vehicle_image: str | None = None


class VehicleResponse(BaseModel):
    id: int
    user_id: int
    vehicle_type: str
    brand: str
    model: str
    year: int
    registration_number: str
    fuel_type: str
    current_mileage: float
    last_service_date: date | None
    last_service_km: float | None
    insurance_expiry: date | None
    vehicle_image: str | None

    model_config = {
        "from_attributes": True
    }