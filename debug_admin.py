from backend.database.connection import SessionLocal, engine
from backend.models.user import User

print("DATABASE USED BY BACKEND:")
print(engine.url)

db = SessionLocal()

try:
    user = db.query(User).filter(
        User.email == "nishant@test.com"
    ).first()

    if user:
        print("\nUSER FOUND:")
        print("ID:", user.id)
        print("EMAIL:", user.email)
        print("IS_ADMIN:", user.is_admin)
        print("IS_ACTIVE:", user.is_active)
    else:
        print("\nUSER NOT FOUND")

finally:
    db.close()