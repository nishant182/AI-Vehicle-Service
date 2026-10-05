from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.routes.auth import get_current_user
from backend.schemas.damage_detection import (
    DamageDetectionResponse,
    DamageItem,
)

router = APIRouter(
    prefix="/damage-detection",
    tags=["AI Damage Detection"]
)

UPLOAD_DIR = Path("uploads/damage")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post("/analyze", response_model=DamageDetectionResponse)
async def analyze_damage(
    vehicle_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == vehicle_id,
            Vehicle.user_id == current_user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    extension = Path(image.filename or "").suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = ".jpg"

    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    file_data = await image.read()

    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    # Basic upload-size protection: 10 MB
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 10 MB"
        )

    file_path.write_bytes(file_data)

    image_url = f"/uploads/damage/{filename}"

    # Temporary demo analysis.
    # Actual computer-vision model will be connected later.
    damages = [
        DamageItem(
            damage_type="Surface Scratch",
            severity="Minor",
            estimated_cost=800,
            description="Possible minor scratch detected on the vehicle body."
        )
    ]

    total_cost = sum(
        damage.estimated_cost
        for damage in damages
    )

    return DamageDetectionResponse(
        vehicle_id=vehicle.id,
        image_url=image_url,
        damage_detected=True,
        damages=damages,
        total_estimated_cost=total_cost,
        recommendation=(
            "Consider getting the affected area inspected by a "
            "professional service center."
        ),
        disclaimer=(
            "This is an AI-assisted preliminary assessment and "
            "not a final professional damage diagnosis."
        )
    )