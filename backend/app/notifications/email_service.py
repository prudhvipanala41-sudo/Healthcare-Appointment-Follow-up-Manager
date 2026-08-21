"""
Email notifications.

Provider: plain SMTP via Flask-Mail, configured for Gmail with an App Password
(free — no billing, works with any Gmail account once 2FA + an App Password
are enabled). This was chosen over SendGrid/Mailgun because those require a
credit card to lift sandbox restrictions, which conflicts with the "free
only" requirement for the hackathon. Documented as a limitation in the README.

Reliability: every send is first written to EmailLog with status="pending".
If the SMTP call succeeds we mark it "sent"; if it raises, we mark it
"failed" and increment attempts, but we DO NOT crash the request — a
background APScheduler job (see notifications/scheduler.py) retries "failed"
and "pending" rows with exponential backoff up to a max number of attempts.
"""
import logging

from flask import current_app
from flask_mail import Message

from app.extensions import db, mail
from app.models import EmailLog

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 5


def queue_and_send_email(to_email: str, subject: str, body: str, category: str):
    log = EmailLog(to_email=to_email, subject=subject, body=body, category=category, status="pending")
    db.session.add(log)
    db.session.commit()
    _attempt_send(log)
    return log


def _attempt_send(log: EmailLog):
    log.attempts += 1
    try:
        if not current_app.config.get("MAIL_USERNAME"):
            raise RuntimeError("MAIL_USERNAME not configured")
        msg = Message(subject=log.subject, recipients=[log.to_email], body=log.body)
        mail.send(msg)
        log.status = "sent"
        log.last_error = None
    except Exception as exc:
        log.status = "failed"
        log.last_error = str(exc)
        logger.warning("Email send failed (attempt %s) to %s: %s", log.attempts, log.to_email, exc)
    db.session.commit()


def retry_failed_emails(app):
    """Called periodically by APScheduler."""
    with app.app_context():
        pending = EmailLog.query.filter(
            EmailLog.status.in_(["pending", "failed"]), EmailLog.attempts < MAX_ATTEMPTS
        ).all()
        for log in pending:
            _attempt_send(log)


# ---- Templated helpers used by the booking/leave/reminder flows ----

def send_booking_confirmation(appointment):
    patient = appointment.patient
    doctor = appointment.doctor.user
    when = f"{appointment.appointment_date} at {appointment.start_time}"

    queue_and_send_email(
        patient.email,
        "Appointment Confirmed",
        f"Hi {patient.name},\n\nYour appointment with Dr. {doctor.name} "
        f"({appointment.doctor.specialisation}) is confirmed for {when}.\n\n"
        "You'll get a reminder closer to the date. Reply to this email if you need to reschedule.",
        "booking_confirmation",
    )
    queue_and_send_email(
        doctor.email,
        "New Appointment Booked",
        f"Hi Dr. {doctor.name},\n\nA new appointment with {patient.name} is booked for {when}.\n"
        f"Symptom form: {'submitted' if appointment.symptoms_text else 'not yet submitted'}.",
        "booking_confirmation",
    )


def send_cancellation(appointment, reason="cancelled"):
    patient = appointment.patient
    doctor = appointment.doctor.user
    when = f"{appointment.appointment_date} at {appointment.start_time}"

    queue_and_send_email(
        patient.email,
        "Appointment Cancelled",
        f"Hi {patient.name},\n\nYour appointment with Dr. {doctor.name} on {when} has been "
        f"cancelled ({reason}). Please rebook at your convenience — we're sorry for the inconvenience.",
        "cancellation",
    )
    queue_and_send_email(
        doctor.email,
        "Appointment Cancelled",
        f"The appointment with {patient.name} on {when} was cancelled ({reason}).",
        "cancellation",
    )


def send_leave_notification(appointment):
    send_cancellation(appointment, reason="doctor marked unavailable (leave) on that date")


def send_medication_reminder_email(patient_email, medicine_name):
    queue_and_send_email(
        patient_email,
        "Medication Reminder",
        f"Reminder: it's time to take your medicine — {medicine_name}. "
        "Follow the dosage instructions given by your doctor.",
        "medication_reminder",
    )
