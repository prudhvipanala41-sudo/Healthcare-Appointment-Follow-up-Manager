import re
from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Appointment, AppointmentStatus, DoctorLeave, DoctorProfile, MedicationReminder, FollowUp
from app.appointments.services import apply_doctor_leave
from app.llm.service import generate_postvisit_summary
from app.notifications.email_service import send_leave_notification, send_appointment_confirmed, send_appointment_rejected
from app.notifications.calendar_service import delete_events, create_events
from app.utils.security import roles_required

bp = Blueprint("doctor", __name__, url_prefix="/api/doctor")

# very small heuristic parser: "<medicine> - twice daily for 5 days" style lines
FREQ_MAP = {
    "once daily": 1, "once a day": 1, "od": 1,
    "twice daily": 2, "twice a day": 2, "bd": 2, "bid": 2,
    "three times daily": 3, "thrice daily": 3, "tid": 3,
    "four times daily": 4, "qid": 4,
}
DAYS_RE = re.compile(r"for\s+(\d+)\s+day", re.IGNORECASE)


def _parse_prescription_lines(prescription_text: str):
    reminders = []
    for line in prescription_text.splitlines():
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        freq = next((v for k, v in FREQ_MAP.items() if k in lower), None)
        if not freq:
            continue
        days_match = DAYS_RE.search(lower)
        days = int(days_match.group(1)) if days_match else 3
        medicine_name = re.split(r"[-–:]", line)[0].strip()
        # Spread doses evenly through waking hours (8am–8pm) for each day.
        # Fix: clamp interval so hour_offset never exceeds 20 (8pm).
        waking_hours = 12  # 8am to 8pm
        interval_hours = waking_hours / freq
        for day in range(days):
            for dose in range(freq):
                hour_offset = 8 + dose * interval_hours
                # Safety clamp — never schedule past 20:00
                hour_offset = min(hour_offset, 20.0)
                remind_at = datetime.utcnow() + timedelta(days=day, hours=hour_offset)
                reminders.append((medicine_name, remind_at))
    return reminders


def _current_doctor_profile():
    user_id = get_jwt_identity()
    profile = DoctorProfile.query.filter_by(user_id=user_id).first()
    return profile


# ────────────────────────────────────────────────────────────
# Profile
# ────────────────────────────────────────────────────────────

@bp.get("/profile")
@roles_required("doctor")
def get_profile():
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404
    return jsonify(profile.to_dict())


@bp.put("/profile")
@roles_required("doctor")
def update_profile():
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404
    data = request.get_json(force=True)
    
    # Update base user fields
    if "name" in data and data["name"].strip():
        profile.user.name = data["name"].strip()
    if "phone" in data:
        profile.user.phone = data["phone"].strip() if data["phone"] else None
        
    # Update doctor profile fields
    for field in ["slot_duration_minutes", "working_start", "working_end", "working_days", "bio"]:
        if field in data:
            setattr(profile, field, data[field])
            
    db.session.commit()
    return jsonify(profile.to_dict())


# ────────────────────────────────────────────────────────────
# Doctor-managed leave
# ────────────────────────────────────────────────────────────

@bp.get("/leaves")
@roles_required("doctor")
def list_leaves():
    """List all leave dates for the logged-in doctor."""
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404
    leaves = DoctorLeave.query.filter_by(doctor_id=profile.id).order_by(DoctorLeave.leave_date).all()
    return jsonify([l.to_dict() for l in leaves])


@bp.post("/leaves")
@roles_required("doctor")
def add_leave():
    """Doctor marks themselves on leave for a date.
    Any existing bookings on that date are cancelled and both sides notified.
    """
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404

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
            current_app.logger.exception("calendar delete failed for leave-cancel appt %s", appt.id)
        try:
            send_leave_notification(appt)
        except Exception:
            current_app.logger.exception("leave notification email failed for appt %s", appt.id)

    return jsonify({
        "message": f"Leave recorded for {leave_date}.",
        "affected_appointments": [a.id for a in affected],
    }), 201


@bp.delete("/leaves/<leave_id>")
@roles_required("doctor")
def remove_leave(leave_id):
    """Doctor removes one of their own leave dates."""
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404

    leave = DoctorLeave.query.filter_by(id=leave_id, doctor_id=profile.id).first_or_404()
    db.session.delete(leave)
    db.session.commit()
    return jsonify({"message": "Leave removed."})


# ────────────────────────────────────────────────────────────
# Appointments
# ────────────────────────────────────────────────────────────

@bp.get("/appointments")
@roles_required("doctor")
def my_appointments():
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404
    date_filter = request.args.get("date")
    q = Appointment.query.filter_by(doctor_id=profile.id)
    if date_filter:
        q = q.filter_by(appointment_date=datetime.strptime(date_filter, "%Y-%m-%d").date())
    appts = q.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()
    return jsonify([a.to_dict() for a in appts])


@bp.post("/appointments/<appointment_id>/notes")
@roles_required("doctor")
def submit_notes(appointment_id):
    profile = _current_doctor_profile()
    appointment = Appointment.query.get_or_404(appointment_id)
    if appointment.doctor_id != profile.id:
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json(force=True)
    notes = (data.get("notes") or "").strip()
    prescription = (data.get("prescription") or "").strip()
    if not notes:
        return jsonify({"error": "notes are required"}), 400

    appointment.doctor_notes = notes
    appointment.prescription_text = prescription
    appointment.status = AppointmentStatus.COMPLETED
    db.session.commit()
    
    import threading
    def _generate_postvisit_async(app, appt_id, text):
        with app.app_context():
            from app.models import Appointment
            from app.extensions import db
            from app.llm.service import generate_postvisit_summary
            
            summary, failed = generate_postvisit_summary(text)
            appt = Appointment.query.get(appt_id)
            if appt:
                appt.postvisit_summary_text = summary
                appt.postvisit_llm_failed = failed
                db.session.commit()

    app = current_app._get_current_object()
    combined = f"Clinical notes: {notes}\nPrescription: {prescription}"
    threading.Thread(target=_generate_postvisit_async, args=(app, appointment.id, combined)).start()

    # Medication reminders derived from the prescription's stated frequency
    if prescription:
        for medicine_name, remind_at in _parse_prescription_lines(prescription):
            db.session.add(MedicationReminder(
                appointment_id=appointment.id,
                patient_id=appointment.patient_id,
                medicine_name=medicine_name,
                remind_at=remind_at,
            ))
        db.session.commit()

    return jsonify(appointment.to_dict())


@bp.post("/appointments/<appointment_id>/status")
@roles_required("doctor")
def update_status(appointment_id):
    profile = _current_doctor_profile()
    appointment = Appointment.query.get_or_404(appointment_id)
    if appointment.doctor_id != profile.id:
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json(force=True)
    new_status = data.get("status")
    
    if new_status not in [AppointmentStatus.CONFIRMED.value, AppointmentStatus.REJECTED.value, AppointmentStatus.CANCELLED.value, AppointmentStatus.RESCHEDULED.value]:
        return jsonify({"error": "invalid status"}), 400

    # Prevent transitions from completed or cancelled back to active
    if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.CANCELLED_BY_LEAVE, AppointmentStatus.REJECTED]:
        return jsonify({"error": "cannot change status of inactive appointment"}), 400

    appointment.status = AppointmentStatus(new_status)
    db.session.commit()

    if new_status == AppointmentStatus.CONFIRMED.value:
        try:
            create_events(appointment)
        except Exception:
            current_app.logger.exception("calendar event creation failed during confirm")
        try:
            send_appointment_confirmed(appointment)
        except Exception:
            current_app.logger.exception("confirm email failed")
            
    elif new_status in [AppointmentStatus.REJECTED.value, AppointmentStatus.CANCELLED.value]:
        try:
            delete_events(appointment)
        except Exception:
            current_app.logger.exception("calendar event deletion failed during reject/cancel")
        try:
            send_appointment_rejected(appointment) # reusing for cancel for simplicity
        except Exception:
            current_app.logger.exception("reject/cancel email failed")

    return jsonify(appointment.to_dict())


@bp.get("/patients")
@roles_required("doctor")
def my_patients():
    profile = _current_doctor_profile()
    if not profile:
        return jsonify({"error": "doctor profile not found"}), 404
        
    # Get all unique patients that have had or have an appointment with this doctor
    appts = Appointment.query.filter_by(doctor_id=profile.id).all()
    
    # Deduplicate patients
    patients_map = {}
    for a in appts:
        if a.patient_id not in patients_map:
            patients_map[a.patient_id] = {
                "id": a.patient_id,
                "name": a.patient.name,
                "email": a.patient.email,
                "phone": a.patient.phone,
                "appointments": []
            }
        patients_map[a.patient_id]["appointments"].append(a.to_dict())
        
    # Sort appointments for each patient (newest first)
    for p in patients_map.values():
        p["appointments"].sort(key=lambda x: (x["appointment_date"], x["start_time"]), reverse=True)
        
    return jsonify(list(patients_map.values()))


@bp.post("/appointments/<appointment_id>/followup")
@roles_required("doctor")
def recommend_followup(appointment_id):
    profile = _current_doctor_profile()
    appointment = Appointment.query.get_or_404(appointment_id)
    if appointment.doctor_id != profile.id:
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json(force=True)
    try:
        recommended_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return jsonify({"error": "date must be YYYY-MM-DD"}), 400

    # Ensure follow up is not in the past
    if recommended_date < datetime.utcnow().date():
        return jsonify({"error": "Follow up date cannot be in the past"}), 400

    follow_up = FollowUp(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        original_appointment_id=appointment.id,
        recommended_date=recommended_date,
        reason=data.get("reason", "")
    )
    db.session.add(follow_up)
    db.session.commit()

    return jsonify(follow_up.to_dict()), 201
