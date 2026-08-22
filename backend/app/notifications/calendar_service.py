"""
Google Calendar integration (OAuth 2.0).

Chosen because the Calendar API's free quota (1,000,000 requests/day) is far
beyond hackathon scale and needs no billing account — only a Google Cloud
project with the Calendar API enabled and an OAuth consent screen in
"Testing" mode (see README "Google Calendar Setup").

Each user connects their own Google account once; we store their refresh
token (CalendarToken) and mint short-lived access tokens as needed. If a user
never connects Calendar, booking/emails still work — calendar sync is
best-effort and never blocks the core flow (see appointments/services.py).
"""
import logging
from datetime import datetime, timedelta

from flask import current_app
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build

from app.extensions import db

logger = logging.getLogger(__name__)


def _credentials_for(calendar_token):
    if not calendar_token:
        return None
    creds = Credentials(
        token=calendar_token.access_token,
        refresh_token=calendar_token.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=current_app.config["GOOGLE_CLIENT_ID"],
        client_secret=current_app.config["GOOGLE_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/calendar.events"],
    )
    if not creds.valid:
        try:
            creds.refresh(GoogleRequest())
            calendar_token.access_token = creds.token
            db.session.commit()
        except Exception as exc:
            logger.warning("Could not refresh Google token for user %s: %s", calendar_token.user_id, exc)
            return None
    return creds


def _service_for(user):
    token = user.calendar_token
    creds = _credentials_for(token)
    if creds is None:
        return None
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _event_body(appointment):
    start_dt = datetime.combine(appointment.appointment_date, datetime.strptime(appointment.start_time, "%H:%M").time())
    end_dt = datetime.combine(appointment.appointment_date, datetime.strptime(appointment.end_time, "%H:%M").time())
    return {
        "summary": f"Appointment: {appointment.patient.name} with Dr. {appointment.doctor.user.name}",
        "description": f"Doctor: Dr. {appointment.doctor.user.name} ({appointment.doctor.specialisation})\nPatient: {appointment.patient.name}\nSymptoms: {appointment.symptoms_text or 'None'}",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": "UTC"},
        "attendees": [
            {"email": appointment.patient.email, "displayName": appointment.patient.name},
            {"email": appointment.doctor.user.email, "displayName": f"Dr. {appointment.doctor.user.name}"},
        ],
        "reminders": {"useDefault": True},
    }



def create_events(appointment):
    """Best-effort: creates an event on both patient's and doctor's calendars, if connected."""
    body = _event_body(appointment)
    logger.info("Creating calendar events for appointment %s (Date: %s, Time: %s)", appointment.id, appointment.appointment_date, appointment.start_time)
    for user, attr in ((appointment.patient, "patient_calendar_event_id"),
                        (appointment.doctor.user, "doctor_calendar_event_id")):
        service = _service_for(user)
        if not service:
            logger.info("User %s (role: %s) has not connected Google Calendar — skipping calendar event", user.id, user.role.value if hasattr(user.role, 'value') else user.role)
            continue
        try:
            event = service.events().insert(calendarId="primary", body=body).execute()
            event_id = event.get("id")
            setattr(appointment, attr, event_id)
            logger.info("Calendar event created successfully for user %s: Event ID %s", user.id, event_id)
        except Exception as exc:
            logger.warning("Calendar create_event failed for user %s: %s", user.id, exc)
    db.session.commit()



def update_events(appointment):
    body = _event_body(appointment)
    for user, attr in ((appointment.patient, "patient_calendar_event_id"),
                        (appointment.doctor.user, "doctor_calendar_event_id")):
        event_id = getattr(appointment, attr)
        service = _service_for(user)
        if not service or not event_id:
            continue
        try:
            service.events().update(calendarId="primary", eventId=event_id, body=body).execute()
        except Exception as exc:
            logger.warning("Calendar update_event failed for user %s: %s", user.id, exc)


def delete_events(appointment):
    for user, attr in ((appointment.patient, "patient_calendar_event_id"),
                        (appointment.doctor.user, "doctor_calendar_event_id")):
        event_id = getattr(appointment, attr)
        service = _service_for(user)
        if not service or not event_id:
            continue
        try:
            service.events().delete(calendarId="primary", eventId=event_id).execute()
        except Exception as exc:
            logger.warning("Calendar delete_event failed for user %s: %s", user.id, exc)
        setattr(appointment, attr, None)
    db.session.commit()
