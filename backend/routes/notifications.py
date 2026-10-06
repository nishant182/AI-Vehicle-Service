from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.notification import Notification
from backend.models.user import User
from backend.routes.auth import get_current_user
from backend.schemas.notification import NotificationResponse

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .all()
    )


@router.put(
    "/read-all",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update(
            {"is_read": True},
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "success": True,
        "updated_count": updated,
        "message": "All notifications marked as read",
    }


@router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return notification
