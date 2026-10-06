import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env for local development. Render/environment variables take precedence.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")

APP_NAME = os.getenv("APP_NAME", "AI Vehicle Service")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# SQLite is a local-development fallback. For production, set DATABASE_URL
# to a persistent database such as Render Postgres.
DEFAULT_SQLITE_PATH = PROJECT_ROOT / "ai_vehicle_service.db"
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}",
)

# SQLAlchemy 2.x expects the psycopg driver for PostgreSQL.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1,
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1,
    )

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError(
            "SECRET_KEY is required in production. "
            "Set it in the Render environment variables."
        )

    # Development-only fallback. Never use this in production.
    SECRET_KEY = "development-only-change-me"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

FRONTEND_ORIGIN = os.getenv(
    "FRONTEND_ORIGIN",
    "https://nishant182.github.io",
)
