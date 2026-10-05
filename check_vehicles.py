from backend.database.connection import SessionLocal
from backend.models.vehicle import Vehicle

db = SessionLocal()

try:
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()

    print("\nALL VEHICLES")
    print("=" * 60)

    for v in vehicles:
        print(
            f"ID={v.id} | "
            f"USER_ID={v.user_id} | "
            f"BRAND={v.brand} | "
            f"MODEL={v.model} | "
            f"REG={v.registration_number}"
        )

    print("=" * 60)
    print("TOTAL VEHICLES:", len(vehicles))

finally:
    db.close()