from datetime import date
from pydantic import BaseModel


class MaintenancePrediction(BaseModel):
    maintenance_type: str
    recommended_at_km: float
    current_km: float
    remaining_km: float
    priority: str
    reason: str


class MaintenanceResponse(BaseModel):
    vehicle_id: int
    vehicle_name: str
    current_mileage: float
    predictions: list[MaintenancePrediction]
    generated_on: date