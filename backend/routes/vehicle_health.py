from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.routes.auth import get_current_user
from backend.schemas.vehicle_health import VehicleHealthResponse


router = APIRouter(
    prefix="/vehicle-health",
    tags=["Vehicle Health"]
)


@router.get("/{vehicle_id}", response_model=VehicleHealthResponse)
def get_vehicle_health(
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
            status_code=404,
            detail="Vehicle not found"
        )

    # Initial health calculation.
    # Later this will be replaced by the AI/ML health engine.
    engine_score = 82
    brakes_score = 85
    battery_score = 80
    tyres_score = 84
    oil_score = 78

    overall_score = round(
        (
            engine_score
            + brakes_score
            + battery_score
            + tyres_score
            + oil_score
        ) / 5
    )

    if overall_score >= 80:
        health_status = "Good"
    elif overall_score >= 60:
        health_status = "Needs Attention"
    else:
        health_status = "Critical"

    recommendations = []

    if oil_score < 80:
        recommendations.append(
            "Engine oil inspection or replacement may be due."
        )

    if battery_score < 80:
        recommendations.append(
            "Consider checking battery condition and voltage."
        )

    if brakes_score < 80:
        recommendations.append(
            "Brake inspection is recommended."
        )

    if tyres_score < 80:
        recommendations.append(
            "Check tyre pressure and tread condition."
        )

    if engine_score < 80:
        recommendations.append(
            "Engine inspection is recommended."
        )

    if not recommendations:
        recommendations.append(
            "Vehicle health looks good. Continue regular maintenance."
        )

    return VehicleHealthResponse(
        vehicle_id=vehicle.id,
        overall_score=overall_score,
        engine_score=engine_score,
        brakes_score=brakes_score,
        battery_score=battery_score,
        tyres_score=tyres_score,
        oil_score=oil_score,
        status=health_status,
        recommendations=recommendations,
        updated_at=datetime.utcnow()
    )