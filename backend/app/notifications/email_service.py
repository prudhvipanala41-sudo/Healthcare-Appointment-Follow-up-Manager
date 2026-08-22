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
import os

from flask import current_app
from flask_mail import Message

from app.extensions import db, mail
from app.models import EmailLog

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 5


import threading

def _attempt_send_background(log_id: int, app):
    with app.app_context():
        log = db.session.get(EmailLog, log_id)
        if log:
            _attempt_send(log)

def queue_and_send_email(to_email: str, subject: str, body: str, category: str):
    # Route fake demo accounts (@demo.com, @clinic.com) to the real MAIL_USERNAME so emails land in your inbox!
    target_email = to_email
    mail_user = current_app.config.get("MAIL_USERNAME")
    if mail_user and ("@demo.com" in to_email or "@clinic.com" in to_email or "@example.com" in to_email):
        target_email = mail_user
        logger.info("Routing demo email recipient %s -> verified inbox %s", to_email, target_email)

    log = EmailLog(to_email=target_email, subject=subject, body=body, category=category, status="pending")
    db.session.add(log)
    db.session.commit()
    logger.info("Dispatched email log #%s to %s (Subject: '%s', Category: %s)", log.id, target_email, subject, category)
    
    # Send email asynchronously in a background thread to prevent blocking the API response
    app = current_app._get_current_object()
    thread = threading.Thread(target=_attempt_send_background, args=(log.id, app))
    thread.start()
    
    return log




import smtplib
import socket
from email.mime.text import MIMEText


def _send_smtp(to_email: str, subject: str, body: str):
    cfg = current_app.config
    resend_key = cfg.get("RESEND_API_KEY") or os.getenv("RESEND_API_KEY")

    # 1. If RESEND_API_KEY is provided, use HTTPS API (Port 443 is never blocked on Render)
    if resend_key:
        import requests
        # In Resend Free Sandbox (onboarding@resend.dev), only verified account email is permitted
        recipient = to_email if to_email.endswith("@gmail.com") else (cfg.get("MAIL_USERNAME") or "prudhvipanala41@gmail.com")
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
            json={
                "from": "Sahayak Health <onboarding@resend.dev>",
                "to": [recipient],
                "subject": f"[{category.replace('_', ' ').title() if 'category' in dir() else 'Notification'}] {subject}",
                "text": body,
            },
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True
        else:
            logger.warning("Resend HTTP error: %s", resp.text)
            raise RuntimeError(f"Resend HTTP API error ({resp.status_code}): {resp.text}")


    # 2. Otherwise use standard SMTP (works on local machine or hosts with open SMTP ports)
    username = cfg.get("MAIL_USERNAME")
    password = cfg.get("MAIL_PASSWORD")
    sender = cfg.get("MAIL_DEFAULT_SENDER") or username
    server = cfg.get("MAIL_SERVER", "smtp.gmail.com")

    if not username or not password:
        raise RuntimeError("Neither RESEND_API_KEY nor MAIL_USERNAME/MAIL_PASSWORD is configured")

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    last_exc = None
    for port, is_ssl in [(465, True), (587, False)]:
        try:
            if is_ssl:
                with smtplib.SMTP_SSL(server, port, timeout=10) as s:
                    s.login(username, password)
                    s.send_message(msg)
                    return True
            else:
                with smtplib.SMTP(server, port, timeout=10) as s:
                    s.starttls()
                    s.login(username, password)
                    s.send_message(msg)
                    return True
        except Exception as exc:
            last_exc = exc
            logger.warning("SMTP attempt on port %s failed: %s", port, exc)

    if last_exc:
        raise last_exc


def _attempt_send(log: EmailLog):
    log.attempts += 1
    try:
        _send_smtp(log.to_email, log.subject, log.body)
        log.status = "sent"
        log.last_error = None
        logger.info("Email #%s successfully sent to %s (Subject: '%s')", log.id, log.to_email, log.subject)
    except Exception as exc:
        log.status = "failed"
        log.last_error = str(exc)
        logger.error("Email #%s send failed (attempt %s) to %s: %s", log.id, log.attempts, log.to_email, exc)
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

def send_booking_pending(appointment):
    patient = appointment.patient
    doctor = appointment.doctor.user
    when = f"{appointment.appointment_date} at {appointment.start_time}"

    queue_and_send_email(
        patient.email,
        "Appointment Request Received",
        f"Hi {patient.name},\n\nYour appointment request with Dr. {doctor.name} "
        f"({appointment.doctor.specialisation}) for {when} has been received.\n\n"
        "Your request is currently PENDING. You will receive another email once the doctor confirms your appointment.",
        "booking_pending",
    )
    queue_and_send_email(
        doctor.email,
        "New Appointment Request",
        f"Hi Dr. {doctor.name},\n\nYou have a new appointment request from {patient.name} for {when}.\n"
        f"Symptom form: {'submitted' if appointment.symptoms_text else 'not yet submitted'}.\n"
        "Please log in to your dashboard to confirm or reject this request.",
        "booking_pending",
    )


def send_appointment_confirmed(appointment):
    patient = appointment.patient
    doctor = appointment.doctor.user
    when = f"{appointment.appointment_date} at {appointment.start_time}"

    queue_and_send_email(
        patient.email,
        "Appointment Confirmed",
        f"Hi {patient.name},\n\nGood news! Your appointment with Dr. {doctor.name} "
        f"for {when} has been CONFIRMED.\n\n"
        "You'll get a reminder closer to the date. Reply to this email if you need to reschedule.",
        "booking_confirmation",
    )


def send_appointment_rejected(appointment):
    patient = appointment.patient
    doctor = appointment.doctor.user
    when = f"{appointment.appointment_date} at {appointment.start_time}"

    queue_and_send_email(
        patient.email,
        "Appointment Request Declined",
        f"Hi {patient.name},\n\nWe're sorry, but your appointment request with Dr. {doctor.name} "
        f"for {when} could not be accepted at this time.\n\n"
        "Please try booking a different time slot or with another doctor.",
        "booking_rejected",
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
