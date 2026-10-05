from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.service import Service
from backend.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
)


router = APIRouter(
    prefix="/services",
    tags=["Services"]
)


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED
)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db)
):
    service = Service(
        name=data.name,
        description=data.description,
        category=data.category,
        base_price=data.base_price,
        estimated_duration=data.estimated_duration,
        is_active=True,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.get(
    "",
    response_model=list[ServiceResponse]
)
def get_services(
    db: Session = Depends(get_db)
):
    services = (
        db.query(Service)
        .filter(Service.is_active == True)
        .order_by(Service.id.asc())
        .all()
    )

    return services


@router.get(
    "/{service_id}",
    response_model=ServiceResponse
)
def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.is_active == True
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    return service


@router.put(
    "/{service_id}",
    response_model=ServiceResponse
)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db)
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return service


@router.delete(
    "/{service_id}"
)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    service.is_active = False

    db.commit()

    return {
        "success": True,
        "message": "Service deactivated successfully"
    }