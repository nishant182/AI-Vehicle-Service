from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.service_history import ServiceHistory
from backend.models.service import Service
from backend.models.service_center import ServiceCenter
from backend.models.vehicle import Vehicle
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.service_history import (
    ServiceHistoryCreate,
    ServiceHistoryResponse,
)


router = APIRouter(
    prefix="/service-history",
    tags=["Service History"]
)


# CREATE SERVICE HISTORY
@router.post(
    "",
    response_model=ServiceHistoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_service_history(
    data: ServiceHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check vehicle belongs to current user
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == data.vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Check service
    service = db.query(Service).filter(
        Service.id == data.service_id,
        Service.is_active == True
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    # Check service center if provided
    if data.service_center_id is not None:
        service_center = db.query(ServiceCenter).filter(
            ServiceCenter.id == data.service_center_id,
            ServiceCenter.is_active == True
        ).first()

        if not service_center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service center not found"
            )

    history = ServiceHistory(
        user_id=current_user.id,
        vehicle_id=data.vehicle_id,
        service_id=data.service_id,
        service_center_id=data.service_center_id,
        service_date=data.service_date,
        mileage=data.mileage,
        cost=data.cost,
        notes=data.notes,
        status="Completed"
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


# GET MY SERVICE HISTORY
@router.get(
    "",
    response_model=list[ServiceHistoryResponse]
)
def get_service_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ServiceHistory).filter(
        ServiceHistory.user_id == current_user.id
    ).order_by(
        ServiceHistory.service_date.desc(),
        ServiceHistory.id.desc()
    ).all()

    return history


# GET HISTORY FOR ONE VEHICLE
@router.get(
    "/vehicle/{vehicle_id}",
    response_model=list[ServiceHistoryResponse]
)
def get_vehicle_service_history(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    history = db.query(ServiceHistory).filter(
        ServiceHistory.vehicle_id == vehicle_id,
        ServiceHistory.user_id == current_user.id
    ).order_by(
        ServiceHistory.service_date.desc(),
        ServiceHistory.id.desc()
    ).all()

    return history


# GET SINGLE HISTORY RECORD
@router.get(
    "/{history_id}",
    response_model=ServiceHistoryResponse
)
def get_single_service_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(ServiceHistory).filter(
        ServiceHistory.id == history_id,
        ServiceHistory.user_id == current_user.id
    ).first()

    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service history record not found"
        )

    return history