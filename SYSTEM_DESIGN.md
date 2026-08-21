# System Design — Sahayak Health Appointment Manager

## Overview

Sahayak Health is a multi-role healthcare appointment management system built on Flask + SQLite (upgradeable to PostgreSQL) with a React frontend. This document covers the four core reliability challenges: double-booking prevention, doctor leave conflict handling, slot hold mechanism, and notification failure handling.

---

## 1. Double-Booking Prevention

The system uses a defence-in-depth approach with two complementary layers.

### Layer 1 — Slot Hold (Optimistic UI Lock)

When a patient selects a time slot, the frontend immediately calls `POST /api/patient/doctors/:id/hold`. This inserts a `SlotHold` row guarded by a database-level `UNIQUE` constraint on `(doctor_id, appointment_date, start_time)`. If another patient already holds that slot, the `INSERT` violates the constraint and the backend returns a `409 Conflict` — the patient is told to pick a different slot before they even start filling in their details.

Holds expire after `SLOT_HOLD_SECONDS` (default: 120 seconds) so an abandoned checkout never permanently blocks a slot. A background APScheduler job runs every minute to `DELETE` expired holds. On booking completion, the hold is also explicitly deleted.

If a hold exists but has already expired (detectable from `expires_at`), the system deletes it and retries the insert once — preventing phantom timeouts from blocking valid bookings.

### Layer 2 — Database Unique Constraint (Authoritative Guard)

The `Appointment` table has a `UNIQUE` constraint on `(doctor_id, appointment_date, start_time, status=BOOKED)`. Even if two patients race past the hold step simultaneously (e.g. hold expired mid-flow, or the hold API was called at exactly the same time), only one `INSERT` can succeed. The second raises a SQLAlchemy `IntegrityError`, which is caught and returned as a clean `409 "slot no longer available"` response. This is the authoritative, race-condition-proof guarantee; the slot hold is a UX courtesy layer on top.

This approach was chosen over application-level `SELECT FOR UPDATE` because SQLite does not support row-level locking, and the constraint works identically when migrated to PostgreSQL.

---

## 2. Doctor Leave Conflict Handling

When an admin or doctor marks a date as a leave day, the `apply_doctor_leave` service function:

1. **Inserts the leave record** into `doctor_leaves`. If a concurrent request already inserted it (race condition), the `IntegrityError` is caught and swallowed — idempotent.
2. **Queries all `BOOKED` appointments** for that doctor on that date.
3. **Updates their status** to `CANCELLED_BY_LEAVE` in a single transaction — patients cannot re-book the same slot after this.
4. For each affected appointment: **deletes the Google Calendar event** (best-effort, caught individually) and **sends a cancellation email** to both patient and doctor, with the reason "doctor marked unavailable (leave) on that date".

Cancellation emails are written to `email_logs` first (status `pending`), so even if the SMTP call fails immediately, the retry job will deliver them. This ensures patients are always notified, even if the mail server is temporarily unreachable.

Doctors can also remove leave days (`DELETE /api/doctor/leaves/:id`). This makes the date available again but does **not** automatically rebook cancelled appointments — patients must rebook manually. This is a deliberate design choice to avoid surprising patients with unexpected re-bookings.

---

## 3. Slot Hold Mechanism

```
Patient selects slot → POST /hold → SlotHold row inserted (expires in 120s)
    ↓
Patient fills symptoms, confirms → POST /book → Appointment inserted → SlotHold deleted
    ↓
If patient abandons → APScheduler cleanup job deletes expired SlotHold every 60s
```

The hold is stored in the database (not in-memory / Redis) so it survives process restarts and works correctly in multi-worker deployments as long as they share the same database. For true horizontal scaling to multiple stateless workers, this is the correct pattern — Redis-based holds would require an additional infrastructure dependency.

The hold TTL (120 seconds) was chosen to give a patient enough time to read the slot details, enter symptoms, and confirm — without holding the slot so long that it blocks others for a meaningful period during peak hours.

---

## 4. Notification Failure Handling

### Email Retry System

Every outbound email is written to the `email_logs` table with `status = "pending"` **before** the SMTP call is attempted. After a successful send, status becomes `"sent"`. On failure, status becomes `"failed"` and `last_error` captures the exception message.

An APScheduler job runs every 2 minutes, queries all rows with `status IN ("pending", "failed") AND attempts < 5`, and retries each one. Attempts are capped at 5 to prevent infinite retry storms on permanently invalid addresses. The final attempt count and last error remain in the log for debugging.

This means: even if the mail server is down at booking time, the confirmation email will be delivered within the next few minutes once it recovers — the booking itself is never blocked or rolled back due to an email failure.

### Google Calendar Best-Effort

Calendar event creation, update, and deletion are all wrapped in individual `try/except` blocks and logged at `WARNING` level. A failure to create a calendar event never affects the booking response or the patient's ability to complete their appointment. If a user's OAuth token has expired and cannot be refreshed, the operation is skipped silently (with a log entry). Users can re-connect their calendar at any time via the navbar.

### LLM Graceful Degradation

Both LLM calls (pre-visit and post-visit summary) are wrapped in `try/except`. On any failure — API key missing, network timeout, malformed JSON, rate limit — the system immediately falls back to a safe default. For pre-visit: urgency is set to `"Medium"`, the raw symptoms become the chief complaint, and three generic questions are provided. For post-visit: the raw doctor notes are returned with a friendly prefix. The `*_llm_failed` flag on the appointment record is set to `true`, and the frontend displays an amber warning banner so neither patient nor doctor is misled into thinking the AI summary is AI-generated when it is not.

---

## Scalability Notes

- **APScheduler** runs in-process. For multi-instance deployments, replace with **Celery + Redis** to avoid duplicate job execution.
- **SQLite** is suitable for a single-server deployment. Switching to PostgreSQL requires only changing `DATABASE_URL` — all models are SQLAlchemy-agnostic.
- **Slot holds in the database** means no Redis dependency for correctness — a deliberate choice for the free-tier single-instance deployment target.
- The `email_logs` table functions as a lightweight, persistent message queue. At high volume, replace with a dedicated queue (SQS, RabbitMQ) backed by a worker pool.
