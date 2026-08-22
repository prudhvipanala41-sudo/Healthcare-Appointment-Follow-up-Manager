import enum
import uuid
from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Role(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class AppointmentStatus(str, enum.Enum):
    BOOKED = "booked"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    CANCELLED_BY_LEAVE = "cancelled_by_leave"


class Urgency(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(Role), nullable=False, default=Role.PATIENT)
    phone = db.Column(db.String(30))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor_profile = db.relationship("DoctorProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    calendar_token = db.relationship("CalendarToken", backref="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role.value, "phone": self.phone}


class DoctorProfile(db.Model):
    __tablename__ = "doctor_profiles"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False)
    specialisation = db.Column(db.String(120), nullable=False, index=True)
    slot_duration_minutes = db.Column(db.Integer, nullable=False, default=20)
    working_start = db.Column(db.String(5), nullable=False, default="09:00")  # HH:MM
    working_end = db.Column(db.String(5), nullable=False, default="17:00")
    working_days = db.Column(db.String(20), nullable=False, default="0,1,2,3,4")  # Mon=0 .. Sun=6
    qualifications = db.Column(db.String(255), default="MBBS, MD")
    experience_years = db.Column(db.Integer, default=10)
    hospital_name = db.Column(db.String(255), default="City Multispeciality Hospital")
    location = db.Column(db.String(100), default="Bengaluru")
    consultation_fee = db.Column(db.Integer, default=800)
    consultation_mode = db.Column(db.String(50), default="Online & In-Clinic")
    languages = db.Column(db.String(255), default="English, Hindi")
    expertise = db.Column(db.Text, default="")
    research_interests = db.Column(db.Text, default="")
    publications = db.Column(db.Text, default="")
    rating = db.Column(db.Float, default=4.8)
    review_count = db.Column(db.Integer, default=45)
    verification_status = db.Column(db.String(50), default="Verified Specialist")
    image_url = db.Column(db.String(500), default="")
    source_url = db.Column(db.String(500), default="")

    leaves = db.relationship("DoctorLeave", backref="doctor", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else "",
            "email": self.user.email if self.user else "",
            "specialisation": self.specialisation,
            "slot_duration_minutes": self.slot_duration_minutes,
            "working_start": self.working_start,
            "working_end": self.working_end,
            "working_days": self.working_days,
            "bio": self.bio or "",
            "qualifications": self.qualifications or "MBBS, MD",
            "experience_years": self.experience_years or 10,
            "hospital_name": self.hospital_name or "City Multispeciality Hospital",
            "location": self.location or "Bengaluru",
            "consultation_fee": self.consultation_fee or 800,
            "consultation_mode": self.consultation_mode or "Online & In-Clinic",
            "languages": self.languages or "English, Hindi",
            "expertise": self.expertise or "",
            "research_interests": self.research_interests or "",
            "publications": self.publications or "",
            "rating": round(float(self.rating or 4.8), 1),
            "review_count": self.review_count or 45,
            "verification_status": self.verification_status or "Verified Specialist",
            "image_url": self.image_url or "",
            "source_url": self.source_url or "",
        }



class DoctorLeave(db.Model):
    __tablename__ = "doctor_leaves"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    doctor_id = db.Column(db.String(36), db.ForeignKey("doctor_profiles.id"), nullable=False)
    leave_date = db.Column(db.Date, nullable=False, index=True)
    reason = db.Column(db.String(255), default="")
    __table_args__ = (db.UniqueConstraint("doctor_id", "leave_date", name="uq_doctor_leave_date"),)

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "leave_date": self.leave_date.isoformat(),
            "reason": self.reason,
        }


class Appointment(db.Model):
    __tablename__ = "appointments"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    patient_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    doctor_id = db.Column(db.String(36), db.ForeignKey("doctor_profiles.id"), nullable=False)

    appointment_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.String(5), nullable=False)  # HH:MM
    end_time = db.Column(db.String(5), nullable=False)

    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.BOOKED, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Pre-visit
    symptoms_text = db.Column(db.Text)
    previsit_summary_json = db.Column(db.Text)  # {urgency, chief_complaint, questions:[...]}
    previsit_llm_failed = db.Column(db.Boolean, default=False)

    # Post-visit
    doctor_notes = db.Column(db.Text)
    prescription_text = db.Column(db.Text)
    postvisit_summary_text = db.Column(db.Text)
    postvisit_llm_failed = db.Column(db.Boolean, default=False)

    # Calendar
    patient_calendar_event_id = db.Column(db.String(255))
    doctor_calendar_event_id = db.Column(db.String(255))

    # Ensures the DB itself rejects a double-booked slot even under race conditions
    __table_args__ = (
        db.UniqueConstraint(
            "doctor_id", "appointment_date", "start_time", "status",
            name="uq_doctor_slot_active",
        ),
    )

    patient = db.relationship("User", foreign_keys=[patient_id])
    doctor = db.relationship("DoctorProfile", foreign_keys=[doctor_id])

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.user.name if self.doctor else None,
            "specialisation": self.doctor.specialisation if self.doctor else None,
            "appointment_date": self.appointment_date.isoformat(),
            "start_time": self.start_time,
            "end_time": self.end_time,
            "status": self.status.value,
            "symptoms_text": self.symptoms_text,
            "previsit_summary": self.previsit_summary_json,
            "previsit_llm_failed": self.previsit_llm_failed,
            "doctor_notes": self.doctor_notes,
            "prescription_text": self.prescription_text,
            "postvisit_summary": self.postvisit_summary_text,
            "postvisit_llm_failed": self.postvisit_llm_failed,
        }


class SlotHold(db.Model):
    """Short-lived hold so two patients can't both be mid-checkout on the same slot."""
    __tablename__ = "slot_holds"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    doctor_id = db.Column(db.String(36), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    patient_id = db.Column(db.String(36), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    __table_args__ = (
        db.UniqueConstraint("doctor_id", "appointment_date", "start_time", name="uq_slot_hold"),
    )


class MedicationReminder(db.Model):
    __tablename__ = "medication_reminders"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    appointment_id = db.Column(db.String(36), db.ForeignKey("appointments.id"), nullable=False)
    patient_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    medicine_name = db.Column(db.String(255))
    remind_at = db.Column(db.DateTime, nullable=False, index=True)
    sent = db.Column(db.Boolean, default=False)
    send_attempts = db.Column(db.Integer, default=0)

    patient = db.relationship("User", foreign_keys=[patient_id])


class EmailLog(db.Model):
    """Records every outbound email attempt so a background job can retry failures."""
    __tablename__ = "email_logs"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    to_email = db.Column(db.String(180), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # booking_confirmation, reminder, cancellation, medication_reminder
    status = db.Column(db.String(20), default="pending")  # pending, sent, failed
    attempts = db.Column(db.Integer, default=0)
    last_error = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CalendarToken(db.Model):
    """Stores each user's Google OAuth2 refresh token so events can be created on their calendar."""
    __tablename__ = "calendar_tokens"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), unique=True, nullable=False)
    refresh_token = db.Column(db.Text, nullable=True)
    access_token = db.Column(db.Text)
    token_expiry = db.Column(db.DateTime)

