from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func

from backend.config import (
    APP_NAME,
    APP_VERSION,
    FRONTEND_ORIGIN,
)
from backend.database.base import Base
from backend.database.connection import engine
from backend.database.seed import seed_initial_data

# Import models so SQLAlchemy knows every table before create_all.
from backend.models import (  # noqa: F401
    Booking,
    Notification,
    Service,
    ServiceCenter,
    ServiceHistory,
    User,
    Vehicle,
    service_center_services,
)

# Routes
from backend.routes.admin import router as admin_router
from backend.routes.ai_assistant import router as ai_assistant_router
from backend.routes.auth import router as auth_router
from backend.routes.booking_status import router as booking_status_router
from backend.routes.bookings import router as booking_router
from backend.routes.cost_estimation import router as cost_estimation_router
from backend.routes.damage_detection import router as damage_detection_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.maintenance import router as maintenance_router
from backend.routes.notifications import router as notifications_router
from backend.routes.profile import router as profile_router
from backend.routes.service_centers import router as service_center_router
from backend.routes.service_center_services import (
    router as service_center_service_router,
)
from backend.routes.service_history import (
    router as service_history_router,
)
from backend.routes.services import router as service_router
from backend.routes.vehicle_health import router as vehicle_health_router
from backend.routes.vehicles import router as vehicle_router


PROJECT_ROOT = Path(__file__).resolve().parents[1]

UPLOADS_DIR = PROJECT_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI(
    title=APP_NAME,
    description="AI-powered vehicle service management system",
    version=APP_VERSION,
)


# Static uploaded images/files.
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOADS_DIR)),
    name="uploads",
)


# Create missing tables and minimum catalog data on startup.
Base.metadata.create_all(bind=engine)
seed_initial_data()


# Temporary production admin bootstrap.
# Set ADMIN_BOOTSTRAP_EMAIL in Render environment variables.
admin_bootstrap_email = os.getenv(
    "ADMIN_BOOTSTRAP_EMAIL",
    ""
).strip().lower()

if admin_bootstrap_email:
    from backend.database.connection import SessionLocal

    db = SessionLocal()

    try:
        admin_user = (
            db.query(User)
            .filter(func.lower(User.email) == admin_bootstrap_email)
            .first()
        )

        if admin_user:
            if not admin_user.is_admin:
                admin_user.is_admin = True
                db.commit()

                print(
                    f"ADMIN BOOTSTRAP: {admin_user.email} is now admin."
                )
            else:
                print(
                    f"ADMIN BOOTSTRAP: {admin_user.email} is already admin."
                )
        else:
            print(
                f"ADMIN BOOTSTRAP: user not found for "
                f"{admin_bootstrap_email}"
            )

    except Exception as error:
        db.rollback()
        print(f"ADMIN BOOTSTRAP ERROR: {error}")

    finally:
        db.close()


# GitHub Pages + local development.
allowed_origins = {
    FRONTEND_ORIGIN.rstrip("/"),
    "https://nishant182.github.io",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
}


app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
)


# API routes
app.include_router(auth_router)
app.include_router(vehicle_router)
app.include_router(service_router)
app.include_router(service_center_router)
app.include_router(service_center_service_router)
app.include_router(booking_router)
app.include_router(booking_status_router)
app.include_router(admin_router)
app.include_router(service_history_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(vehicle_health_router)
app.include_router(ai_assistant_router)
app.include_router(maintenance_router)
app.include_router(damage_detection_router)
app.include_router(cost_estimation_router)
app.include_router(profile_router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Vehicle Service API is running",
        "version": APP_VERSION,
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": APP_NAME,
    }