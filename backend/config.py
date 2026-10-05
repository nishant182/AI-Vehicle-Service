import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "AI Vehicle Service")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./ai_vehicle_service.db"
)

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "change-this-secret-key-in-production"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60