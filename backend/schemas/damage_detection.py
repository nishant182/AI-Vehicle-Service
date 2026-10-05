from pydantic import BaseModel


class DamageItem(BaseModel):
    damage_type: str
    severity: str
    estimated_cost: float
    description: str


class DamageDetectionResponse(BaseModel):
    vehicle_id: int
    image_url: str
    damage_detected: bool
    damages: list[DamageItem]
    total_estimated_cost: float
    recommendation: str
    disclaimer: str