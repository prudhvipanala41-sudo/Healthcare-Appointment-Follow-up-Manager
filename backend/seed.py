"""
Seeds one admin, two doctors, and one patient so you can log in and click
around immediately after setup. Run with: python seed.py
"""
import os
from dotenv import load_dotenv

load_dotenv()
from app import create_app
from app.extensions import db
from app.models import DoctorProfile, Role, User

app = create_app()

with app.app_context():
    if User.query.filter_by(email="admin@clinic.com").first():
        print("Seed data already present, skipping.")
    else:
        admin = User(name="Clinic Admin", email="admin@clinic.com", role=Role.ADMIN)
        admin.set_password("Admin@123")
        db.session.add(admin)

        doc1 = User(name="Asha Rao", email="dr.asha@clinic.com", role=Role.DOCTOR)
        doc1.set_password("Doctor@123")
        db.session.add(doc1)
        db.session.flush()
        db.session.add(DoctorProfile(
            user_id=doc1.id, specialisation="General Physician",
            slot_duration_minutes=20, working_start="09:00", working_end="13:00",
            working_days="0,1,2,3,4",
        ))

        doc2 = User(name="Karan Mehta", email="dr.karan@clinic.com", role=Role.DOCTOR)
        doc2.set_password("Doctor@123")
        db.session.add(doc2)
        db.session.flush()
        db.session.add(DoctorProfile(
            user_id=doc2.id, specialisation="Dermatologist",
            slot_duration_minutes=15, working_start="14:00", working_end="18:00",
            working_days="0,1,2,3,4,5",
        ))

        patient = User(name="Demo Patient", email="prudhvipanala41@gmail.com", role=Role.PATIENT)
        patient.set_password("Patient@123")
        db.session.add(patient)

        db.session.commit()
        print("Seeded: admin@clinic.com / Admin@123")
        print("        dr.asha@clinic.com / Doctor@123")
        print("        dr.karan@clinic.com / Doctor@123")
        print("        patient@demo.com / Patient@123")
