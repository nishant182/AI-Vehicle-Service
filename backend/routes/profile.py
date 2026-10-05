from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put("", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if profile_data.name is not None:
        current_user.name = profile_data.name

    if profile_data.phone is not None:
        current_user.phone = profile_data.phone

    db.commit()
    db.refresh(current_user)

    return current_user