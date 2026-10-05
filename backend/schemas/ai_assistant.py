from pydantic import BaseModel, Field


class AIProblemRequest(BaseModel):
    vehicle_id: int = Field(gt=0)
    problem: str = Field(min_length=3, max_length=2000)


class AIProblemResponse(BaseModel):
    vehicle_id: int
    problem: str
    possible_causes: list[str]
    recommended_actions: list[str]
    urgency: str
    disclaimer: str