from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: str | None = None

    category: str = Field(
        min_length=2,
        max_length=50
    )

    base_price: float = Field(
        default=0,
        ge=0
    )

    estimated_duration: int = Field(
        default=60,
        ge=1
    )


class ServiceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = None

    category: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    base_price: float | None = Field(
        default=None,
        ge=0
    )

    estimated_duration: int | None = Field(
        default=None,
        ge=1
    )

    is_active: bool | None = None


class ServiceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category: str
    base_price: float
    estimated_duration: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }