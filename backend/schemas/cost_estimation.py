from pydantic import BaseModel, Field


class CostEstimationRequest(BaseModel):
    vehicle_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    damage_type: str | None = None
    severity: str | None = None


class CostEstimationResponse(BaseModel):
    vehicle_id: int
    service_id: int
    service_name: str
    base_price: float
    additional_cost: float
    estimated_cost: float
    currency: str
    explanation: str