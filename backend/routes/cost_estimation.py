from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.service import Service
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.routes.auth import get_current_user
from backend.schemas.cost_estimation import (
    CostEstimationRequest,
    CostEstimationResponse,
)

router = APIRouter(
    prefix="/cost-estimation",
    tags=["Cost Estimation"]
)


@router.post("", response_model=CostEstimationResponse)
def estimate_cost(
    data: CostEstimationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify vehicle belongs to current user
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == data.vehicle_id,
            Vehicle.user_id == current_user.id
        )
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    # Find service
    service = (
        db.query(Service)
        .filter(
            Service.id == data.service_id,
            Service.is_active == True
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    base_price = service.base_price
    additional_cost = 0.0

    # Additional cost based on damage severity
    if data.severity:
        severity = data.severity.lower()

        if severity == "minor":
            additional_cost = 500.0

        elif severity == "moderate":
            additional_cost = 1500.0

        elif severity == "major":
            additional_cost = 3000.0

    # Extra adjustment for common damage types
    if data.damage_type:
        damage_type = data.damage_type.lower()

        if "scratch" in damage_type:
            additional_cost += 300.0

        elif "dent" in damage_type:
            additional_cost += 1000.0

        elif "bumper" in damage_type:
            additional_cost += 1500.0

        elif "paint" in damage_type:
            additional_cost += 1200.0

    estimated_cost = base_price + additional_cost

    if data.damage_type and data.severity:
        explanation = (
            f"Estimated using the {service.name} base price "
            f"plus an adjustment for {data.severity} "
            f"{data.damage_type}."
        )

    elif data.severity:
        explanation = (
            f"Estimated using the {service.name} base price "
            f"plus a {data.severity} damage adjustment."
        )

    else:
        explanation = (
            f"Estimated based on the current base price of "
            f"{service.name}."
        )

    return CostEstimationResponse(
        vehicle_id=vehicle.id,
        service_id=service.id,
        service_name=service.name,
        base_price=base_price,
        additional_cost=additional_cost,
        estimated_cost=estimated_cost,
        currency="INR",
        explanation=explanation,
    )