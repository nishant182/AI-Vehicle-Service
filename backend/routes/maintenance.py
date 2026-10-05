from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.user import User
from backend.models.vehicle import Vehicle
from backend.routes.auth import get_current_user
from backend.schemas.maintenance import (
    MaintenancePrediction,
    MaintenanceResponse,
)

router = APIRouter(
    prefix="/maintenance",
    tags=["Predictive Maintenance"]
)


@router.get("/{vehicle_id}", response_model=MaintenanceResponse)
def get_maintenance_prediction(
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

    current_km = vehicle.current_mileage or 0

    # Maintenance intervals in kilometres.
    maintenance_rules = [
        {
            "type": "Engine Oil Change",
            "interval": 10000,
            "priority": "High"
        },
        {
            "type": "Brake Service",
            "interval": 15000,
            "priority": "Medium"
        },
        {
            "type": "Tyre Inspection",
            "interval": 10000,
            "priority": "Medium"
        },
        {
            "type": "Battery Check",
            "interval": 20000,
            "priority": "Low"
        },
        {
            "type": "General Service",
            "interval": 10000,
            "priority": "High"
        }
    ]

    predictions = []

    for rule in maintenance_rules:
        interval = rule["interval"]

        if vehicle.last_service_km is not None:
            base_km = vehicle.last_service_km
        else:
            base_km = 0

        # Find the next maintenance interval after the last service.
        recommended_at_km = (
            ((base_km // interval) + 1) * interval
        )

        remaining_km = max(
            recommended_at_km - current_km,
            0
        )

        if remaining_km <= 0:
            priority = "Overdue"
        elif remaining_km <= 1000:
            priority = "High"
        elif remaining_km <= 3000:
            priority = "Medium"
        else:
            priority = rule["priority"]

        if remaining_km <= 0:
            reason = (
                f"{rule['type']} is due based on the current mileage."
            )
        else:
            reason = (
                f"Recommended after approximately "
                f"{remaining_km:.0f} more km."
            )

        predictions.append(
            MaintenancePrediction(
                maintenance_type=rule["type"],
                recommended_at_km=recommended_at_km,
                current_km=current_km,
                remaining_km=remaining_km,
                priority=priority,
                reason=reason
            )
        )

    return MaintenanceResponse(
        vehicle_id=vehicle.id,
        vehicle_name=f"{vehicle.brand} {vehicle.model}",
        current_mileage=current_km,
        predictions=predictions,
        generated_on=date.today()
    )