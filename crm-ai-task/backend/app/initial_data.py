from .db import SessionLocal, engine
from .models import Base
from .crud import create_hcp
from .schemas import HCPCreate

def seed():
    db = SessionLocal()
    try:
        for name in ["Dr. Meera Patel", "Dr. Rohan Sharma", "Dr. Anita Rao"]:
            h = HCPCreate(name=name, organisation="City Hospital", speciality="Cardiology")
            create_hcp(db, h)
    finally:
        db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed()
    print("Seeded HCPs")
