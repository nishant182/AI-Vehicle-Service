from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.service import Service
from backend.models.service_center import ServiceCenter
from backend.models.service_center_service import service_center_services
from backend.schemas.service import ServiceResponse


router = APIRouter(
    prefix="/service-centers",
    tags=["Service Center Services"]
)


@router.post(
    "/{service_center_id}/services/{service_id}",
    response_model=ServiceResponse
)
def add_service_to_center(
    service_center_id: int,
    service_id: int,
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

    existing = db.execute(
        service_center_services.select().where(
            service_center_services.c.service_center_id == service_center_id,
            service_center_services.c.service_id == service_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is already available at this center"
        )

    db.execute(
        service_center_services.insert().values(
            service_center_id=service_center_id,
            service_id=service_id
        )
    )

    db.commit()

    return service


@router.get(
    "/{service_center_id}/services",
    response_model=list[ServiceResponse]
)
def get_center_services(
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

    services = (
        db.query(Service)
        .join(
            service_center_services,
            Service.id == service_center_services.c.service_id
        )
        .filter(
            service_center_services.c.service_center_id == service_center_id,
            Service.is_active == True
        )
        .order_by(Service.id.asc())
        .all()
    )

    return services


@router.delete(
    "/{service_center_id}/services/{service_id}"
)
def remove_service_from_center(
    service_center_id: int,
    service_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        service_center_services.delete().where(
            service_center_services.c.service_center_id == service_center_id,
            service_center_services.c.service_id == service_id
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service is not available at this center"
        )

    db.commit()

    return {
        "success": True,
        "message": "Service removed from service center"
    }