from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.service_center import ServiceCenter
from backend.schemas.service_center import (
    ServiceCenterCreate,
    ServiceCenterUpdate,
    ServiceCenterResponse,
)


router = APIRouter(
    prefix="/service-centers",
    tags=["Service Centers"]
)


@router.post(
    "",
    response_model=ServiceCenterResponse,
    status_code=status.HTTP_201_CREATED
)
def create_service_center(
    data: ServiceCenterCreate,
    db: Session = Depends(get_db)
):
    service_center = ServiceCenter(
        name=data.name,
        address=data.address,
        location=data.location,
        contact=data.contact,
        opening_time=data.opening_time,
        closing_time=data.closing_time,
        rating=data.rating,
        review_count=data.review_count,
        pricing_info=data.pricing_info,
        description=data.description,
        is_active=True,
    )

    db.add(service_center)
    db.commit()
    db.refresh(service_center)

    return service_center


@router.get(
    "",
    response_model=list[ServiceCenterResponse]
)
def get_service_centers(
    db: Session = Depends(get_db)
):
    service_centers = (
        db.query(ServiceCenter)
        .filter(ServiceCenter.is_active == True)
        .order_by(ServiceCenter.id.asc())
        .all()
    )

    return service_centers


@router.get(
    "/{service_center_id}",
    response_model=ServiceCenterResponse
)
def get_service_center(
    service_center_id: int,
    db: Session = Depends(get_db)
):
    service_center = (
        db.query(ServiceCenter)
        .filter(
            ServiceCenter.id == service_center_id,
            ServiceCenter.is_active == True
        )
        .first()
    )

    if not service_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service center not found"
        )

    return service_center


@router.put(
    "/{service_center_id}",
    response_model=ServiceCenterResponse
)
def update_service_center(
    service_center_id: int,
    data: ServiceCenterUpdate,
    db: Session = Depends(get_db)
):
    service_center = (
        db.query(ServiceCenter)
        .filter(ServiceCenter.id == service_center_id)
        .first()
    )

    if not service_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service center not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(service_center, field, value)

    db.commit()
    db.refresh(service_center)

    return service_center


@router.delete(
    "/{service_center_id}"
)
def delete_service_center(
    service_center_id: int,
    db: Session = Depends(get_db)
):
    service_center = (
        db.query(ServiceCenter)
        .filter(ServiceCenter.id == service_center_id)
        .first()
    )

    if not service_center:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service center not found"
        )

    service_center.is_active = False

    db.commit()

    return {
        "success": True,
        "message": "Service center deactivated successfully"
    }