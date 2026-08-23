import json
from datetime import date, datetime

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Appointment, AppointmentStatus, DoctorProfile, MedicationReminder
from app.appointments.services import BookingError, book_appointment, cancel_appointment, generate_available_slots, hold_slot
from app.llm.service import generate_previsit_summary
from app.notifications.calendar_service import create_events, delete_events
from app.notifications.email_service import send_booking_pending, send_cancellation, send_appointment_confirmed
from app.utils.security import roles_required

bp = Blueprint("patient", __name__, url_prefix="/api/patient")

@bp.get("/debug_enum")
def debug_enum():
    from app.extensions import db
    from sqlalchemy import text
    try:
        res = db.session.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'appointmentstatus';"))
        labels = [row[0] for row in res]
        return jsonify({"labels": labels})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.get("/migrate_enum")
def migrate_enum():
    from sqlalchemy import text
    try:
        with db.engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(text("ALTER TABLE appointments ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
        return jsonify({"message": "Successfully altered status to VARCHAR"})
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@bp.get("/doctors")
@roles_required("patient", "admin")
def search_doctors():
    try:
        from app.models import User
        from sqlalchemy import or_

        search = request.args.get("search", "").strip()
        specialisation = request.args.get("specialisation", "").strip()
        location = request.args.get("location", "").strip()
        mode = request.args.get("mode", "").strip()
        sort_by = request.args.get("sort_by", "").strip()

        q = DoctorProfile.query.join(User, DoctorProfile.user_id == User.id)

        if search:
            search_pattern = f"%{search}%"
            q = q.filter(
                or_(
                    User.name.ilike(search_pattern),
                    DoctorProfile.specialisation.ilike(search_pattern),
                    DoctorProfile.hospital_name.ilike(search_pattern),
                    DoctorProfile.location.ilike(search_pattern),
                    DoctorProfile.expertise.ilike(search_pattern),
                )
            )

        if specialisation and specialisation.lower() != "all":
            q = q.filter(DoctorProfile.specialisation.ilike(f"%{specialisation}%"))

        if location and location.lower() != "all":
            q = q.filter(DoctorProfile.location.ilike(f"%{location}%"))

        if mode and mode.lower() != "all":
            q = q.filter(DoctorProfile.consultation_mode.ilike(f"%{mode}%"))

        if sort_by == "experience":
            q = q.order_by(DoctorProfile.experience_years.desc())
        elif sort_by == "fee_asc":
            q = q.order_by(DoctorProfile.consultation_fee.asc())
        elif sort_by == "fee_desc":
            q = q.order_by(DoctorProfile.consultation_fee.desc())
        else:
            q = q.order_by(DoctorProfile.rating.desc())

        return jsonify([d.to_dict() for d in q.all()])
    except Exception as exc:
        current_app.logger.exception("Error in search_doctors: %s", exc)
        return jsonify({"error": str(exc)}), 500



@bp.get("/doctors/<doctor_id>")
@roles_required("patient", "admin")
def get_doctor_detail(doctor_id):
    doctor = DoctorProfile.query.get_or_404(doctor_id)
    return jsonify(doctor.to_dict())



@bp.get("/doctors/<doctor_id>/slots")
@roles_required("patient", "admin")
def doctor_slots(doctor_id):
    try:
        date_str = request.args.get("date")
        if not date_str:
            return jsonify({"error": "date query param (YYYY-MM-DD) is required"}), 400
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "date must be YYYY-MM-DD"}), 400

        # Reject past dates
        if target_date < date.today():
            return jsonify({"date": date_str, "slots": [], "reason": "past_date"})

        doctor = DoctorProfile.query.get_or_404(doctor_id)
        return jsonify({"date": date_str, "slots": generate_available_slots(doctor, target_date)})
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@bp.post("/doctors/<doctor_id>/hold")
@roles_required("patient")
def hold(doctor_id):
    data = request.get_json(force=True)
    try:
        target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return jsonify({"error": "date must be YYYY-MM-DD"}), 400

    if target_date < date.today():
        return jsonify({"error": "Cannot hold a slot in the past."}), 400

    start_time = data.get("start_time")
    if not start_time:
        return jsonify({"error": "start_time is required"}), 400

    patient_id = get_jwt_identity()
    try:
        try:
            hold_obj = hold_slot(doctor_id, target_date, start_time, patient_id, current_app.config["SLOT_HOLD_SECONDS"])
        except BookingError as e:
            return jsonify({"error": e.message}), e.status_code
        return jsonify({"hold_id": hold_obj.id, "expires_at": hold_obj.expires_at.isoformat()}), 201
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@bp.post("/doctors/<doctor_id>/book")
@roles_required("patient")
def book(doctor_id):
    data = request.get_json(force=True)
    try:
        target_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        return jsonify({"error": "date must be YYYY-MM-DD"}), 400

    start_time = data.get("start_time")
    symptoms = (data.get("symptoms") or "").strip()
    patient_id = get_jwt_identity()
    doctor = DoctorProfile.query.get_or_404(doctor_id)

    try:
        try:
            appointment = book_appointment(doctor, patient_id, target_date, start_time, data.get("hold_id"))
        except BookingError as e:
            return jsonify({"error": e.message}), e.status_code

        import threading
        def _generate_async(app, appt_id, text):
            with app.app_context():
                from app.models import Appointment
                from app.extensions import db
                from app.llm.service import generate_previsit_summary
                import json
                
                summary, failed = generate_previsit_summary(text)
                appt = Appointment.query.get(appt_id)
                if appt:
                    appt.previsit_summary_json = json.dumps(summary)
                    appt.previsit_llm_failed = failed
                    db.session.commit()

        # Save symptoms and generate pre-visit summary if provided at booking time
        if symptoms:
            appointment.symptoms_text = symptoms
            db.session.commit()
            
            # Run LLM generation in background so the booking request returns instantly
            app = current_app._get_current_object()
            threading.Thread(target=_generate_async, args=(app, appointment.id, symptoms)).start()

        # Best-effort side effects — never let these fail the booking itself.
        try:
            send_booking_pending(appointment)
        except Exception:
            current_app.logger.exception("booking pending email failed")
        try:
            create_events(appointment)
        except Exception:
            current_app.logger.exception("calendar event creation failed")

        return jsonify({"message": "Appointment booked successfully", "appointment_id": appointment.id}), 201
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@bp.post("/appointments/<appointment_id>/symptoms")
@roles_required("patient")
def submit_symptoms(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    if appointment.patient_id != get_jwt_identity():
        return jsonify({"error": "forbidden"}), 403

    # Prevent re-submission — only allow if symptoms not yet submitted
    if appointment.symptoms_text:
        return jsonify({"error": "Symptoms have already been submitted for this appointment."}), 409

    symptoms = (request.get_json(force=True).get("symptoms") or "").strip()
    if not symptoms:
        return jsonify({"error": "symptoms text is required"}), 400

    appointment.symptoms_text = symptoms
    db.session.commit()
    
    import threading
    def _generate_async_submit(app, appt_id, text):
        with app.app_context():
            from app.models import Appointment
            from app.extensions import db
            from app.llm.service import generate_previsit_summary
            import json
            
            summary, failed = generate_previsit_summary(text)
            appt = Appointment.query.get(appt_id)
            if appt:
                appt.previsit_summary_json = json.dumps(summary)
                appt.previsit_llm_failed = failed
                db.session.commit()

    app = current_app._get_current_object()
    threading.Thread(target=_generate_async_submit, args=(app, appointment.id, symptoms)).start()
    return jsonify(appointment.to_dict())


@bp.get("/appointments")
@roles_required("patient")
def my_appointments():
    patient_id = get_jwt_identity()
    appts = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.appointment_date.desc()).all()
    return jsonify([a.to_dict() for a in appts])


@bp.post("/appointments/<appointment_id>/cancel")
@roles_required("patient")
def cancel(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    if appointment.patient_id != get_jwt_identity():
        return jsonify({"error": "forbidden"}), 403
    if appointment.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        return jsonify({"error": "appointment is not active"}), 400

    cancel_appointment(appointment)
    try:
        delete_events(appointment)
    except Exception:
        current_app.logger.exception("calendar event deletion failed")
    try:
        send_cancellation(appointment, reason="cancelled by patient")
    except Exception:
        current_app.logger.exception("cancellation email failed")
    return jsonify(appointment.to_dict())

@bp.get("/journey")
@roles_required("patient")
def get_journey():
    patient_id = get_jwt_identity()
    from app.models import FollowUp
    
    past_appointments = Appointment.query.filter_by(patient_id=patient_id, status=AppointmentStatus.COMPLETED).order_by(Appointment.appointment_date.desc()).all()
    follow_ups = FollowUp.query.filter_by(patient_id=patient_id).order_by(FollowUp.recommended_date.asc()).all()
    
    return jsonify({
        "completed_appointments": [a.to_dict() for a in past_appointments],
        "follow_ups": [f.to_dict() for f in follow_ups]
    })

@bp.get("/records")
@roles_required("patient")
def get_records():
    patient_id = get_jwt_identity()
    appts = Appointment.query.filter_by(patient_id=patient_id, status=AppointmentStatus.COMPLETED).order_by(Appointment.appointment_date.desc()).all()
    return jsonify([a.to_dict() for a in appts])

@bp.get("/hospitals")
@roles_required("patient", "admin")
def get_hospitals():
    from app.models import Hospital
    hospitals = Hospital.query.all()
    return jsonify([h.to_dict() for h in hospitals])

@bp.get("/hospitals/<hospital_id>")
@roles_required("patient", "admin")
def get_hospital(hospital_id):
    from app.models import Hospital
    hospital = Hospital.query.get_or_404(hospital_id)
    return jsonify(hospital.to_dict())
