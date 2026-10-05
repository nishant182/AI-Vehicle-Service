from pydantic import BaseModel, Field


class ServiceCenterCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150
    )

    address: str = Field(
        min_length=5
    )

    location: str | None = Field(
        default=None,
        max_length=200
    )

    contact: str | None = Field(
        default=None,
        max_length=20
    )

    opening_time: str | None = Field(
        default=None,
        max_length=10
    )

    closing_time: str | None = Field(
        default=None,
        max_length=10
    )

    rating: float = Field(
        default=0,
        ge=0,
        le=5
    )

    review_count: int = Field(
        default=0,
        ge=0
    )

    pricing_info: str | None = None

    description: str | None = None


class ServiceCenterUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    address: str | None = Field(
        default=None,
        min_length=5
    )

    location: str | None = None

    contact: str | None = None

    opening_time: str | None = None

    closing_time: str | None = None

    rating: float | None = Field(
        default=None,
        ge=0,
        le=5
    )

    review_count: int | None = Field(
        default=None,
        ge=0
    )

    pricing_info: str | None = None

    description: str | None = None

    is_active: bool | None = None


class ServiceCenterResponse(BaseModel):
    id: int
    name: str
    address: str
    location: str | None
    contact: str | None
    opening_time: str | None
    closing_time: str | None
    rating: float
    review_count: int
    pricing_info: str | None
    description: str | None
    is_active: bool

    model_config = {
        "from_attributes": True
    }