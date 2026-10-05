from pydantic import BaseModel, EmailStr, Field


class ProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None
    is_active: bool
    is_admin: bool


class ProfileUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )
    phone: str | None = Field(
        default=None,
        max_length=20
    )