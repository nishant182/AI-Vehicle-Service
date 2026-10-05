from backend.database.connection import SessionLocal
from backend.models.user import User

db = SessionLocal()

try:
    user = db.query(User).filter(
        User.email == "nishant@test.com"
    ).first()

    if not user:
        print("USER NOT FOUND")
    else:
        print("ID:", user.id)
        print("NAME:", user.name)
        print("EMAIL:", user.email)
        print("IS ADMIN:", user.is_admin)

finally:
    db.close()