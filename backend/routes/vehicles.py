from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
)


router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)


# =========================================
# IMAGE UPLOAD CONFIGURATION
# =========================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = PROJECT_ROOT / "uploads" / "vehicles"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# =========================================
# CREATE VEHICLE
# =========================================

@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing_vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.registration_number
            == data.registration_number
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle with this registration number already exists"
        )

    vehicle = Vehicle(
        user_id=current_user.id,
        vehicle_type=data.vehicle_type,
        brand=data.brand,
        model=data.model,
        year=data.year,
        registration_number=data.registration_number,
        fuel_type=data.fuel_type,
        current_mileage=data.current_mileage,
        last_service_date=data.last_service_date,
        last_service_km=data.last_service_km,
        insurance_expiry=data.insurance_expiry,
        vehicle_image=data.vehicle_image,
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle


# =========================================
# UPLOAD VEHICLE IMAGE
# =========================================

@router.post(
    "/{vehicle_id}/image",
    response_model=VehicleResponse
)
async def upload_vehicle_image(
    vehicle_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------------------
    # FIND VEHICLE
    # -----------------------------------------

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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )


    # -----------------------------------------
    # CHECK FILE TYPE
    # -----------------------------------------

    if image.content_type not in ALLOWED_IMAGE_TYPES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, JPEG, PNG or WEBP images are allowed"
        )


    # -----------------------------------------
    # READ FILE
    # -----------------------------------------

    image_data = await image.read()


    # -----------------------------------------
    # CHECK FILE SIZE
    # -----------------------------------------

    if len(image_data) > MAX_IMAGE_SIZE:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size must be less than 5 MB"
        )


    if len(image_data) == 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is empty"
        )


    # -----------------------------------------
    # CREATE UNIQUE FILE NAME
    # -----------------------------------------

    extension = ALLOWED_IMAGE_TYPES[
        image.content_type
    ]

    filename = (
        f"vehicle_{vehicle.id}_"
        f"{uuid4().hex}"
        f"{extension}"
    )


    file_path = UPLOAD_DIR / filename


    # -----------------------------------------
    # SAVE IMAGE
    # -----------------------------------------

    try:

        with open(file_path, "wb") as file:

            file.write(image_data)

    except Exception as error:

        print(
            "Vehicle image save error:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save vehicle image"
        )


    # -----------------------------------------
    # DELETE OLD IMAGE
    # -----------------------------------------

    if vehicle.vehicle_image:

        old_path = Path(
            vehicle.vehicle_image.lstrip("/")
        )

        try:

            if (
                old_path.exists()
                and old_path.is_file()
                and old_path.parent == UPLOAD_DIR
            ):

                old_path.unlink()

        except Exception as error:

            print(
                "Old vehicle image delete warning:",
                error
            )


    # -----------------------------------------
    # SAVE IMAGE PATH IN DATABASE
    # -----------------------------------------

    vehicle.vehicle_image = (
        f"/uploads/vehicles/{filename}"
    )

    db.commit()
    db.refresh(vehicle)

    return vehicle


# =========================================
# GET MY VEHICLES
# =========================================

@router.get(
    "",
    response_model=list[VehicleResponse]
)
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    vehicles = (
        db.query(Vehicle)
        .filter(
            Vehicle.user_id == current_user.id
        )
        .order_by(Vehicle.id.desc())
        .all()
    )

    return vehicles


# =========================================
# GET SINGLE VEHICLE
# =========================================

@router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return vehicle


# =========================================
# UPDATE VEHICLE
# =========================================

@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse
)
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "registration_number" in update_data:

        existing_vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.registration_number
                == update_data["registration_number"],
                Vehicle.id != vehicle_id
            )
            .first()
        )

        if existing_vehicle:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle with this registration number already exists"
            )

    for field, value in update_data.items():

        setattr(
            vehicle,
            field,
            value
        )

    db.commit()
    db.refresh(vehicle)

    return vehicle


# =========================================
# DELETE VEHICLE
# =========================================

@router.delete(
    "/{vehicle_id}"
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )


    # Delete vehicle image if present

    if vehicle.vehicle_image:

        image_path = Path(
            vehicle.vehicle_image.lstrip("/")
        )

        try:

            if (
                image_path.exists()
                and image_path.is_file()
                and image_path.parent == UPLOAD_DIR
            ):

                image_path.unlink()

        except Exception as error:

            print(
                "Vehicle image delete warning:",
                error
            )


    db.delete(vehicle)
    db.commit()

    return {
        "success": True,
        "message": "Vehicle deleted successfully"
    }