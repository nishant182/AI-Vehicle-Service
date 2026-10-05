from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import APP_NAME, APP_VERSION
from backend.database.base import Base
from backend.database.connection import engine

# Models
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

# Routes
from backend.routes.auth import router as auth_router
from backend.routes.vehicles import router as vehicle_router
from backend.routes.services import router as service_router
from backend.routes.service_centers import router as service_center_router
from backend.routes.service_center_services import (
    router as service_center_service_router
)
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


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=APP_NAME,
    description="AI-powered vehicle service management system",
    version=APP_VERSION,
)


# ============================================================
# STATIC FILES
# ============================================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# ============================================================
# DATABASE
# ============================================================

# Create database tables if they do not already exist.
Base.metadata.create_all(bind=engine)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        # Production - GitHub Pages
        "https://nishant182.github.io",

        # Local development
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],

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


# ============================================================
# API ROUTES
# ============================================================

# Authentication
app.include_router(auth_router)

# Vehicles
app.include_router(vehicle_router)

# Services
app.include_router(service_router)

# Service Centers
app.include_router(service_center_router)

# Service Center Services
app.include_router(service_center_service_router)

# Bookings
app.include_router(booking_router)

# Booking Status
app.include_router(booking_status_router)

# Admin
app.include_router(admin_router)

# Service History
app.include_router(service_history_router)

# Notifications
app.include_router(notifications_router)

# Dashboard
app.include_router(dashboard_router)

# Vehicle Health
app.include_router(vehicle_health_router)

# AI Assistant
app.include_router(ai_assistant_router)

# Maintenance
app.include_router(maintenance_router)

# Damage Detection
app.include_router(damage_detection_router)

# Cost Estimation
app.include_router(cost_estimation_router)

# Profile
app.include_router(profile.router)

# Admin additional routes
app.include_router(admin.router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Vehicle Service API is running",
        "version": APP_VERSION,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": APP_NAME,
    }