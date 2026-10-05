from backend.database.connection import SessionLocal
from backend.models.vehicle import Vehicle

db = SessionLocal()

try:
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()

    for vehicle in vehicles:
        vehicle.user_id = 4

    db.commit()

    print("✅ Vehicle ownership fixed!")
    print("All vehicles are now assigned to USER_ID=4")

finally:
    db.close()