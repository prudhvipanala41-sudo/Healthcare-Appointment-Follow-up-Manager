"""
Core booking logic.

Double-booking prevention strategy (defense in depth, see SYSTEM_DESIGN.md):

1. Slot hold (optimistic, short-lived): when a patient selects a slot, the
   frontend calls /hold which inserts a SlotHold row guarded by a unique
   constraint on (doctor_id, date, start_time). If another patient already
   holds it, the insert fails -> patient is told to pick another slot. Holds
   expire after SLOT_HOLD_SECONDS (default 120s) and are swept by a
   background job, so an abandoned checkout doesn't block the slot forever.

2. Database-level uniqueness (authoritative): the Appointment table has a
   UNIQUE constraint on (doctor_id, appointment_date, start_time, status).
   Even if two requests race past the hold check (e.g. hold expired mid-race,
   or hold step was skipped), the final INSERT can only succeed once — the
   second commit raises IntegrityError, which we catch and turn into a clean
   409 "slot no longer available" response. This is what actually guarantees
   correctness; the hold is just a nicer UX layer on top.

Leave conflict handling: when an admin marks a doctor on leave for a date,
we find every BOOKED appointment on that date, mark it CANCELLED_BY_LEAVE,
free the DB slot, remove the calendar events, and email + notify both sides.
"""
import logging
from datetime import date, datetime, time, timedelta

from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Appointment, AppointmentStatus, DoctorLeave, DoctorProfile, SlotHold

logger = logging.getLogger(__name__)


class BookingError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _parse_hm(hm: str) -> time:
    h, m = map(int, hm.split(":"))
    return time(h, m)


def generate_available_slots(doctor: DoctorProfile, target_date: date):
    """Returns list of 'HH:MM' start times still open on target_date."""
    weekday = target_date.weekday()
    working_days = doctor.working_days or "0,1,2,3,4,5,6"
    if str(weekday) not in working_days.split(","):
        return []

    is_on_leave = DoctorLeave.query.filter_by(doctor_id=doctor.id, leave_date=target_date).first()
    if is_on_leave:
        return []

    working_start = doctor.working_start or "09:00"
    working_end = doctor.working_end or "17:00"
    duration = doctor.slot_duration_minutes or 20
    if duration <= 0:
        duration = 20

    try:
        start = datetime.combine(target_date, _parse_hm(working_start))
        end = datetime.combine(target_date, _parse_hm(working_end))
    except Exception as e:
        logger.error(f"Error parsing working hours for doctor {doctor.id}: {e}")
        start = datetime.combine(target_date, time(9, 0))
        end = datetime.combine(target_date, time(17, 0))

    step = timedelta(minutes=duration)

    all_appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == target_date
    ).all()
    
    # Filter in Python to completely bypass PostgreSQL ENUM strict casting errors
    valid_statuses = {
        AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING,
        "confirmed", "pending", "CONFIRMED", "PENDING"
    }
    booked = {
        a.start_time
        for a in all_appointments
        if a.status in valid_statuses or getattr(a.status, 'value', str(a.status)) in valid_statuses
    }
    held_cutoff = datetime.utcnow()
    held = {
        h.start_time
        for h in SlotHold.query.filter_by(doctor_id=doctor.id, appointment_date=target_date).all()
        if h.expires_at > held_cutoff
    }

    slots = []
    cursor = start
    while cursor + step <= end:
        hm = cursor.strftime("%H:%M")
        if hm not in booked and hm not in held:
            slots.append(hm)
        cursor += step
    return slots


def hold_slot(doctor_id: str, target_date: date, start_time: str, patient_id: str, hold_seconds: int):
    hold = SlotHold(
        doctor_id=doctor_id,
        appointment_date=target_date,
        start_time=start_time,
        patient_id=patient_id,
        expires_at=datetime.utcnow() + timedelta(seconds=hold_seconds),
    )
    db.session.add(hold)
    try:
        db.session.commit()
        return hold
    except IntegrityError:
        db.session.rollback()
        # Slot might just have an expired stale hold; try to clear and retry once.
        existing = SlotHold.query.filter_by(
            doctor_id=doctor_id, appointment_date=target_date, start_time=start_time
        ).first()
        if existing and existing.expires_at <= datetime.utcnow():
            db.session.delete(existing)
            db.session.commit()
            db.session.add(hold)
            try:
                db.session.commit()
                return hold
            except IntegrityError:
                db.session.rollback()
        raise BookingError("This slot was just taken by someone else. Please pick another slot.", 409)


def book_appointment(doctor: DoctorProfile, patient_id: str, target_date: date, start_time: str, hold_id: str = None):
    if DoctorLeave.query.filter_by(doctor_id=doctor.id, leave_date=target_date).first():
        raise BookingError("Doctor is on leave that day.", 409)

    slot_start = datetime.combine(target_date, _parse_hm(start_time))
    slot_end = slot_start + timedelta(minutes=doctor.slot_duration_minutes)

    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=doctor.id,
        appointment_date=target_date,
        start_time=start_time,
        end_time=slot_end.strftime("%H:%M"),
        status=AppointmentStatus.PENDING,
    )
    db.session.add(appointment)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise BookingError("This slot was just booked by another patient. Please choose a different slot.", 409)

    if hold_id:
        hold = SlotHold.query.get(hold_id)
        if hold:
            db.session.delete(hold)
            db.session.commit()

    return appointment


def cancel_appointment(appointment: Appointment):
    appointment.status = AppointmentStatus.CANCELLED
    # Clear any active hold for this slot so another patient can book it immediately
    hold = SlotHold.query.filter_by(
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        start_time=appointment.start_time,
    ).first()
    if hold:
        db.session.delete(hold)
    db.session.commit()


def apply_doctor_leave(doctor: DoctorProfile, leave_date: date, reason: str = ""):
    """Marks a doctor on leave and returns the list of affected appointments (already cancelled)."""
    existing = DoctorLeave.query.filter_by(doctor_id=doctor.id, leave_date=leave_date).first()
    if not existing:
        try:
            db.session.add(DoctorLeave(doctor_id=doctor.id, leave_date=leave_date, reason=reason))
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            # Already exists due to a race — that's fine, continue

    affected = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == leave_date,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
    ).all()
    for appt in affected:
        appt.status = AppointmentStatus.CANCELLED_BY_LEAVE
    db.session.commit()
    return affected

