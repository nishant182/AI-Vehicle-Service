from sqlalchemy import Column, ForeignKey, Integer, Table

from backend.database.base import Base


service_center_services = Table(
    "service_center_services",
    Base.metadata,

    Column(
        "service_center_id",
        Integer,
        ForeignKey("service_centers.id"),
        primary_key=True
    ),

    Column(
        "service_id",
        Integer,
        ForeignKey("services.id"),
        primary_key=True
    ),
)