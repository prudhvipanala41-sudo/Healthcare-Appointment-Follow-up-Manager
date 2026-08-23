from datetime import datetime

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import DoctorLeave, DoctorProfile, Role, User, Appointment, AppointmentStatus, Hospital
from app.appointments.services import apply_doctor_leave
from app.notifications.email_service import send_leave_notification
from app.notifications.calendar_service import delete_events
from app.utils.security import roles_required

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@bp.post("/doctors")
@roles_required("admin")
def create_doctor():
    data = request.get_json(force=True)
    required = ["name", "email", "password", "specialisation"]
    if any(not data.get(f) for f in required):
        return jsonify({"error": f"required fields: {', '.join(required)}"}), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(name=data["name"], email=data["email"].lower(), role=Role.DOCTOR, phone=data.get("phone"))
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    profile = DoctorProfile(
        user_id=user.id,
        specialisation=data["specialisation"],
        slot_duration_minutes=data.get("slot_duration_minutes", 20),
        working_start=data.get("working_start", "09:00"),
        working_end=data.get("working_end", "17:00"),
        working_days=data.get("working_days", "0,1,2,3,4"),
        bio=data.get("bio", ""),
        qualifications=data.get("qualifications", "MBBS, MD"),
        experience_years=data.get("experience_years", 10),
        hospital_name=data.get("hospital_name", "City Multispeciality Hospital"),
        location=data.get("location", "Bengaluru"),
        consultation_fee=data.get("consultation_fee", 800),
        consultation_mode=data.get("consultation_mode", "Online & In-Clinic"),
        languages=data.get("languages", "English, Hindi"),
        expertise=data.get("expertise", ""),
        research_interests=data.get("research_interests", ""),
        publications=data.get("publications", ""),
        rating=data.get("rating", 4.8),
        review_count=data.get("review_count", 50),
        verification_status=data.get("verification_status", "Verified Specialist"),
        source_url=data.get("source_url", ""),
    )
    db.session.add(profile)
    db.session.commit()
    return jsonify(profile.to_dict()), 201


@bp.get("/doctors")
@roles_required("admin")
def list_doctors():
    return jsonify([d.to_dict() for d in DoctorProfile.query.all()])


@bp.put("/doctors/<doctor_id>")
@roles_required("admin")
def update_doctor(doctor_id):
    profile = DoctorProfile.query.get_or_404(doctor_id)
    data = request.get_json(force=True)
    fields = [
        "specialisation", "slot_duration_minutes", "working_start", "working_end", "working_days", "bio",
        "qualifications", "experience_years", "hospital_name", "location", "consultation_fee",
        "consultation_mode", "languages", "expertise", "research_interests", "publications",
        "rating", "review_count", "verification_status", "source_url"
    ]
    for field in fields:
        if field in data:
            setattr(profile, field, data[field])
    db.session.commit()
    return jsonify(profile.to_dict())



@bp.delete("/doctors/<doctor_id>")
@roles_required("admin")
def delete_doctor(doctor_id):
    """Delete a doctor profile and their user account."""
    profile = DoctorProfile.query.get_or_404(doctor_id)
    user = profile.user
    db.session.delete(user)  # cascades to profile, leaves, etc.
    db.session.commit()
    return jsonify({"message": "Doctor deleted."})


@bp.post("/doctors/<doctor_id>/leave")
@roles_required("admin")
def mark_leave(doctor_id):
    """Marks doctor on leave for a date. Any existing bookings on that date are
    cancelled, their calendar events removed, and both sides notified by email."""
    profile = DoctorProfile.query.get_or_404(doctor_id)
    data = request.get_json(force=True)
    try:
        leave_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return jsonify({"error": "date must be YYYY-MM-DD"}), 400

    affected = apply_doctor_leave(profile, leave_date, data.get("reason", ""))
    for appt in affected:
        try:
            delete_events(appt)
        except Exception:
            pass
        try:
            send_leave_notification(appt)
        except Exception:
            pass

    return jsonify({
        "message": f"Doctor marked on leave for {leave_date}.",
        "affected_appointments": [a.id for a in affected],
    })


@bp.get("/doctors/<doctor_id>/leaves")
@roles_required("admin")
def list_leaves(doctor_id):
    """List all leave dates for a given doctor."""
    profile = DoctorProfile.query.get_or_404(doctor_id)
    leaves = DoctorLeave.query.filter_by(doctor_id=profile.id).order_by(DoctorLeave.leave_date).all()
    return jsonify([l.to_dict() for l in leaves])


@bp.delete("/doctors/<doctor_id>/leaves/<leave_id>")
@roles_required("admin")
def delete_leave(doctor_id, leave_id):
    """Remove a specific leave day for a doctor."""
    profile = DoctorProfile.query.get_or_404(doctor_id)
    leave = DoctorLeave.query.filter_by(id=leave_id, doctor_id=profile.id).first_or_404()
    db.session.delete(leave)
    db.session.commit()
    return jsonify({"message": "Leave removed."})


# ────────────────────────────────────────────────────────────
# Analytics & Users
# ────────────────────────────────────────────────────────────

@bp.get("/analytics")
@roles_required("admin")
def get_analytics():
    total_patients = User.query.filter_by(role=Role.PATIENT).count()
    total_doctors = DoctorProfile.query.count()
    total_hospitals = Hospital.query.count()
    total_appointments = Appointment.query.count()
    
    today = datetime.utcnow().date()
    todays_appointments = Appointment.query.filter_by(appointment_date=today).count()
    pending_verifications = DoctorProfile.query.filter_by(verification_status="Pending").count()
    completed_consultations = Appointment.query.filter_by(status=AppointmentStatus.COMPLETED).count()
    cancelled_appointments = Appointment.query.filter(
        Appointment.status.in_([AppointmentStatus.CANCELLED, AppointmentStatus.CANCELLED_BY_LEAVE])
    ).count()

    return jsonify({
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_hospitals": total_hospitals,
        "total_appointments": total_appointments,
        "todays_appointments": todays_appointments,
        "pending_verifications": pending_verifications,
        "completed_consultations": completed_consultations,
        "cancelled_appointments": cancelled_appointments
    })


@bp.get("/users")
@roles_required("admin")
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@bp.delete("/users/<user_id>")
@roles_required("admin")
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == Role.ADMIN:
        return jsonify({"error": "cannot delete an admin"}), 403
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted."})


# ────────────────────────────────────────────────────────────
# Hospitals
# ────────────────────────────────────────────────────────────

@bp.post("/hospitals")
@roles_required("admin")
def create_hospital():
    data = request.get_json(force=True)
    hospital = Hospital(
        name=data.get("name"),
        location=data.get("location"),
        address=data.get("address", ""),
        image_url=data.get("image_url", ""),
        contact_phone=data.get("contact_phone", ""),
        contact_email=data.get("contact_email", ""),
        website=data.get("website", ""),
        emergency_services=data.get("emergency_services", True),
        specialities_text=data.get("specialities_text", "")
    )
    db.session.add(hospital)
    db.session.commit()
    return jsonify(hospital.to_dict()), 201


@bp.put("/hospitals/<hospital_id>")
@roles_required("admin")
def update_hospital(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    data = request.get_json(force=True)
    
    fields = [
        "name", "location", "address", "image_url", "verification_status",
        "contact_phone", "contact_email", "website", "emergency_services",
        "specialities_text", "rating"
    ]
    for field in fields:
        if field in data:
            setattr(hospital, field, data[field])
            
    db.session.commit()
    return jsonify(hospital.to_dict())


@bp.delete("/hospitals/<hospital_id>")
@roles_required("admin")
def delete_hospital(hospital_id):
    hospital = Hospital.query.get_or_404(hospital_id)
    db.session.delete(hospital)
    db.session.commit()
    return jsonify({"message": "Hospital deleted."})


# ────────────────────────────────────────────────────────────
# Appointments
# ────────────────────────────────────────────────────────────

@bp.get("/appointments")
@roles_required("admin")
def list_appointments():
    appts = Appointment.query.order_by(Appointment.appointment_date.desc()).all()
    return jsonify([a.to_dict() for a in appts])
