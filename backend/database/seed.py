from sqlalchemy import select

from backend.database.connection import SessionLocal
from backend.models.service import Service
from backend.models.service_center import ServiceCenter
from backend.models.service_center_service import service_center_services


DEFAULT_SERVICES = [
    {
        "name": "General Service",
        "description": "Routine inspection and maintenance for your vehicle.",
        "category": "Maintenance",
        "base_price": 2200,
        "estimated_duration": 120,
    },
    {
        "name": "Engine Oil Change",
        "description": "Engine oil and basic filter inspection.",
        "category": "Maintenance",
        "base_price": 1200,
        "estimated_duration": 60,
    },
    {
        "name": "Brake Service",
        "description": "Brake inspection and servicing.",
        "category": "Safety",
        "base_price": 1800,
        "estimated_duration": 90,
    },
    {
        "name": "AC Service",
        "description": "Air-conditioning inspection and service.",
        "category": "Comfort",
        "base_price": 1500,
        "estimated_duration": 90,
    },
    {
        "name": "Full Vehicle Inspection",
        "description": "Comprehensive vehicle health inspection.",
        "category": "Inspection",
        "base_price": 1000,
        "estimated_duration": 60,
    },
]

DEFAULT_CENTERS = [
    {
        "name": "AutoCare Service Center",
        "address": "MP Nagar, Bhopal, Madhya Pradesh",
        "location": "Bhopal",
        "contact": "9876543210",
        "opening_time": "09:00",
        "closing_time": "19:00",
        "rating": 4.5,
        "review_count": 120,
        "pricing_info": "Standard service pricing",
        "description": "Professional vehicle servicing and inspection.",
    },
    {
        "name": "AutoCare Indore",
        "address": "Vijay Nagar, Indore, Madhya Pradesh",
        "location": "Indore",
        "contact": "9876543211",
        "opening_time": "09:00",
        "closing_time": "19:00",
        "rating": 4.4,
        "review_count": 95,
        "pricing_info": "Standard service pricing",
        "description": "Reliable maintenance and repair services.",
    },
]


def seed_initial_data() -> None:
    """Create minimum catalog data for a brand-new database."""
    db = SessionLocal()

    try:
        services = db.query(Service).all()

        if not services:
            services = [
                Service(**item)
                for item in DEFAULT_SERVICES
            ]
            db.add_all(services)
            db.flush()

        centers = db.query(ServiceCenter).all()

        if not centers:
            centers = [
                ServiceCenter(**item)
                for item in DEFAULT_CENTERS
            ]
            db.add_all(centers)
            db.flush()

        # Make every seeded service bookable at every seeded center.
        existing_pairs = set(
            db.execute(
                select(
                    service_center_services.c.service_center_id,
                    service_center_services.c.service_id,
                )
            ).all()
        )

        for center in centers:
            for service in services:
                pair = (center.id, service.id)

                if pair not in existing_pairs:
                    db.execute(
                        service_center_services.insert().values(
                            service_center_id=center.id,
                            service_id=service.id,
                        )
                    )

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
