import os
import sys
from sqlalchemy import text
from flask import Flask

# Add the project directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import Hospital, DoctorProfile

app = create_app()

def run_migration():
    with app.app_context():
        # 1. Create new tables (Hospitals, FollowUps)
        db.create_all()
        print("Ensured all tables are created.")
        
        # 2. Add hospital_id to doctor_profiles if it doesn't exist
        try:
            db.session.execute(text("ALTER TABLE doctor_profiles ADD COLUMN hospital_id VARCHAR(36) REFERENCES hospitals(id)"))
            db.session.commit()
            print("Added hospital_id column to doctor_profiles.")
        except Exception as e:
            db.session.rollback()
            if "duplicate column name" in str(e).lower():
                print("Column hospital_id already exists.")
            else:
                print(f"Error adding hospital_id: {e}")
                
        # 3. Seed hospitals if empty
        if Hospital.query.count() == 0:
            hospitals = [
                Hospital(
                    name="Apollo City Hospital",
                    location="Bengaluru",
                    address="154/11 Bannerghatta Road, Bengaluru",
                    image_url="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=2072&auto=format&fit=crop",
                    contact_phone="+91 80 2222 1111",
                    contact_email="info@apollocity.com",
                    website="www.apollocity.com",
                    emergency_services=True,
                    specialities_text="Cardiology, Neurology, Orthopedics",
                    rating=4.8
                ),
                Hospital(
                    name="Fortis Care",
                    location="Mumbai",
                    address="Mulund Goregaon Link Road, Mumbai",
                    image_url="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop",
                    contact_phone="+91 22 4343 3333",
                    contact_email="contact@fortiscare.com",
                    website="www.fortiscare.com",
                    emergency_services=True,
                    specialities_text="Oncology, Pediatrics, General Medicine",
                    rating=4.6
                ),
                Hospital(
                    name="Max Super Speciality",
                    location="Delhi",
                    address="Saket Institutional Area, New Delhi",
                    image_url="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop",
                    contact_phone="+91 11 2651 5050",
                    contact_email="support@maxsuper.com",
                    website="www.maxsuper.com",
                    emergency_services=True,
                    specialities_text="Gastroenterology, Pulmonology, Urology",
                    rating=4.7
                )
            ]
            db.session.add_all(hospitals)
            db.session.commit()
            print("Seeded 3 demo hospitals.")
            
        # 4. Link existing doctors to a hospital randomly if they don't have one
        doctors = DoctorProfile.query.filter_by(hospital_id=None).all()
        hospitals = Hospital.query.all()
        if doctors and hospitals:
            import random
            for doc in doctors:
                h = random.choice(hospitals)
                doc.hospital_id = h.id
                doc.hospital_name = h.name
                doc.location = h.location
            db.session.commit()
            print(f"Linked {len(doctors)} existing doctors to hospitals.")

if __name__ == "__main__":
    run_migration()
