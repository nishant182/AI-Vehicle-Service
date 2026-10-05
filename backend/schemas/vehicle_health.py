from datetime import datetime
from pydantic import BaseModel, Field


class VehicleHealthResponse(BaseModel):
    vehicle_id: int
    overall_score: int = Field(ge=0, le=100)

    engine_score: int = Field(ge=0, le=100)
    brakes_score: int = Field(ge=0, le=100)
    battery_score: int = Field(ge=0, le=100)
    tyres_score: int = Field(ge=0, le=100)
    oil_score: int = Field(ge=0, le=100)

    status: str
    recommendations: list[str]

    updated_at: datetime