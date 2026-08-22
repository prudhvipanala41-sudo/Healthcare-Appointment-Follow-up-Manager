"""
Seeds comprehensive multi-specialty clinical database:
- 1 Admin
- 1 Patient
- 18 Verified Specialist & Demo Doctor Profiles across 15+ Specialties
"""
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app import create_app
from app.extensions import db
from app.models import DoctorProfile, Role, User
from app.doctors_data import DOCTORS_DATA


def run_seed(app):
    with app.app_context():
        from sqlalchemy import text
        dialect = db.engine.dialect.name
        columns = [
            ("doctor_profiles", "qualifications", "VARCHAR(255) DEFAULT 'MBBS, MD'"),
            ("doctor_profiles", "experience_years", "INTEGER DEFAULT 10"),
            ("doctor_profiles", "hospital_name", "VARCHAR(255) DEFAULT 'City Multispeciality Hospital'"),
            ("doctor_profiles", "location", "VARCHAR(100) DEFAULT 'Bengaluru'"),
            ("doctor_profiles", "consultation_fee", "INTEGER DEFAULT 800"),
            ("doctor_profiles", "consultation_mode", "VARCHAR(50) DEFAULT 'Online & In-Clinic'"),
            ("doctor_profiles", "languages", "VARCHAR(255) DEFAULT 'English, Hindi'"),
            ("doctor_profiles", "expertise", "TEXT DEFAULT ''"),
            ("doctor_profiles", "research_interests", "TEXT DEFAULT ''"),
            ("doctor_profiles", "publications", "TEXT DEFAULT ''"),
            ("doctor_profiles", "rating", "FLOAT DEFAULT 4.8"),
            ("doctor_profiles", "review_count", "INTEGER DEFAULT 45"),
            ("doctor_profiles", "verification_status", "VARCHAR(50) DEFAULT 'Verified Specialist'"),
            ("doctor_profiles", "image_url", "VARCHAR(500) DEFAULT ''"),
            ("doctor_profiles", "source_url", "VARCHAR(500) DEFAULT ''"),
        ]
        for table, col, col_type in columns:
            try:
                if dialect == "postgresql":
                    db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                elif dialect == "sqlite":
                    try:
                        db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                    except Exception:
                        pass
                db.session.commit()
            except Exception:
                db.session.rollback()

        # 1. Ensure Admin exists

        admin = User.query.filter_by(email="admin@clinic.com").first()
        if not admin:
            admin = User(name="Clinic Admin", email="admin@clinic.com", role=Role.ADMIN)
            admin.set_password("Admin@123")
            db.session.add(admin)

        # 2. Ensure Demo Patient exists with real email
        patient = User.query.filter_by(email="prudhvipanala41@gmail.com").first()
        if not patient:
            old_patient = User.query.filter_by(email="patient@demo.com").first()
            if old_patient:
                old_patient.email = "prudhvipanala41@gmail.com"
            else:
                patient = User(name="Demo Patient", email="prudhvipanala41@gmail.com", role=Role.PATIENT)
                patient.set_password("Patient@123")
                db.session.add(patient)

        # 3. Seed / update all 18 doctors
        for data in DOCTORS_DATA:
            user = User.query.filter_by(email=data["email"]).first()
            if not user:
                user = User(name=data["name"].replace("Dr. ", ""), email=data["email"], role=Role.DOCTOR)
                user.set_password("Doctor@123")
                db.session.add(user)
                db.session.flush()

            profile = DoctorProfile.query.filter_by(user_id=user.id).first()
            if not profile:
                profile = DoctorProfile(user_id=user.id, specialisation=data["specialisation"])
                db.session.add(profile)

            # Update all rich metadata fields
            for k, v in data.items():
                if k not in ["name", "email"] and hasattr(profile, k):
                    setattr(profile, k, v)

        db.session.commit()
        print(f"Successfully seeded {len(DOCTORS_DATA)} multi-specialty doctors into database!")


if __name__ == "__main__":
    app = create_app()
    run_seed(app)
