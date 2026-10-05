from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import APP_NAME, APP_VERSION
from backend.database.base import Base
from backend.database.connection import engine
from backend.models import User, Vehicle
from backend.routes.auth import router as auth_router
from backend.routes.vehicles import router as vehicle_router
from backend.routes.services import router as service_router
from backend.models import User, Vehicle, Service, ServiceCenter
from backend.routes.service_centers import router as service_center_router
from backend.routes.bookings import router as booking_router
from backend.routes.booking_status import router as booking_status_router
from backend.routes.admin import router as admin_router
from backend.routes.service_history import router as service_history_router
from backend.routes.notifications import router as notifications_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.vehicle_health import router as vehicle_health_router
from backend.routes.ai_assistant import router as ai_assistant_router
from backend.routes.maintenance import router as maintenance_router
from backend.routes.damage_detection import router as damage_detection_router
from backend.routes.cost_estimation import router as cost_estimation_router
from backend.routes import profile
from backend.routes import admin

from backend.models import (
    User,
    Vehicle,
    Service,
    ServiceCenter,
    service_center_services,
    Booking,
    ServiceHistory,
    Notification,
)

from backend.routes.service_center_services import (
    router as service_center_service_router
)

from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title=APP_NAME,
    description="AI-powered vehicle service management system",
    version=APP_VERSION
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# Create database tables
Base.metadata.create_all(bind=engine)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication routes
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
app.include_router(profile.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Vehicle Service API is running",
        "version": APP_VERSION
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": APP_NAME
    }