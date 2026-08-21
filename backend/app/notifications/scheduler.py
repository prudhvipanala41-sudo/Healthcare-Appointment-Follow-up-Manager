"""
Background jobs, run via APScheduler in-process.

Why APScheduler instead of Celery + Redis: for a hackathon-scale app running
on a single free web-service instance (Render/Railway free tier), spinning up
Redis + a separate worker process adds infra cost/complexity with no real
benefit at this scale. APScheduler runs inside the same process, needs no
extra service, and is documented in the README as a "swap for Celery+Redis
when scaling beyond one instance" decision.

Two jobs:
1. retry_failed_emails — every 2 minutes, retries any pending/failed EmailLog rows.
2. send_due_medication_reminders — every 1 minute, sends any MedicationReminder
   whose remind_at has passed and hasn't been sent yet.
3. cleanup_expired_slot_holds — every 1 minute, deletes expired SlotHold rows
   so abandoned bookings don't permanently block a slot.
"""
import logging
from datetime import datetime

from app.extensions import db, scheduler
from app.models import MedicationReminder, SlotHold
from app.notifications.email_service import retry_failed_emails, send_medication_reminder_email

logger = logging.getLogger(__name__)


def send_due_medication_reminders(app):
    with app.app_context():
        due = MedicationReminder.query.filter(
            MedicationReminder.sent.is_(False),
            MedicationReminder.remind_at <= datetime.utcnow(),
            MedicationReminder.send_attempts < 5,
        ).all()
        for reminder in due:
            reminder.send_attempts += 1
            try:
                send_medication_reminder_email(reminder.patient.email, reminder.medicine_name)
                reminder.sent = True
            except Exception as exc:
                logger.warning("Medication reminder failed: %s", exc)
        db.session.commit()


def cleanup_expired_slot_holds(app):
    with app.app_context():
        SlotHold.query.filter(SlotHold.expires_at <= datetime.utcnow()).delete()
        db.session.commit()


def init_scheduler(app):
    if scheduler.running:
        return
    scheduler.add_job(lambda: retry_failed_emails(app), "interval", minutes=2, id="retry_emails")
    scheduler.add_job(lambda: send_due_medication_reminders(app), "interval", minutes=1, id="med_reminders")
    scheduler.add_job(lambda: cleanup_expired_slot_holds(app), "interval", minutes=1, id="cleanup_holds")
    scheduler.start()
