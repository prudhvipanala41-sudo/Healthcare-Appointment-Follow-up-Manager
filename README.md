# Sahayak Health — Healthcare Appointment Manager

> **Full-stack healthcare appointment management system** with AI-powered symptom summaries, role-based access, Google Calendar integration, email notifications, and medication reminders.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [LLM Prompts](#llm-prompts)
8. [Google Calendar Setup](#google-calendar-setup)
9. [Email Setup](#email-setup)
10. [Deployment](#deployment)

---

## Features

| Role | Capabilities |
|------|-------------|
| **Admin** | Create/edit/delete doctor profiles, manage specialisation/working hours/slot duration, mark/remove leave days, view all doctor leaves |
| **Doctor** | View upcoming & past appointments, read AI pre-visit summaries, submit post-visit notes & prescription, manage own profile & leave days |
| **Patient** | Register/login, search doctors by specialisation, book slots with hold mechanism, submit symptoms, receive AI pre-visit summary, view post-visit summary, cancel appointments |

**System-wide:**
- 🔒 Double-booking prevention (slot hold + DB unique constraint)
- 📧 Email notifications (booking, cancellation, leave, medication reminders)
- 📅 Google Calendar events created/updated/deleted automatically
- 🤖 LLM-generated pre-visit and post-visit summaries (Groq — free tier)
- ⏰ Background jobs: email retry, medication reminders, slot hold cleanup
- 🎨 Premium dark glassmorphism UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Flask 3.0, SQLAlchemy, Flask-JWT-Extended, Flask-Mail |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (role: patient / doctor / admin) |
| LLM | Groq API (llama-3.3-70b-versatile) — free tier |
| Email | Flask-Mail via Gmail SMTP (free App Password) |
| Calendar | Google Calendar API v3 with OAuth 2.0 |
| Jobs | APScheduler (in-process background jobs) |
| Frontend | React 19, Vite, TailwindCSS 3, Axios |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone & enter the project

```bash
cd healthcare-appointment-manager1
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit with your keys
python run.py          # starts on http://localhost:5000
```

The database is created automatically on first run. Seed demo data:

```bash
python seed.py
```

**Demo accounts (after seed):**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinic.com | Admin@123 |
| Doctor | dr.asha@clinic.com | Doctor@123 |
| Patient | patient@demo.com | Patient@123 |

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if backend isn't on localhost:5000
npm run dev            # starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Core
FLASK_ENV=development
SECRET_KEY=change-me-to-a-random-string
JWT_SECRET_KEY=change-me-to-another-random-string

# Database — SQLite by default; swap to Postgres for production
DATABASE_URL=sqlite:///healthcare.db

# LLM — Get a free key at https://console.groq.com/keys
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Email — Gmail App Password (see Email Setup section below)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_DEFAULT_SENDER=your@gmail.com

# Google Calendar OAuth 2.0 (see Google Calendar Setup below)
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth2callback

# Frontend origin for OAuth redirects
FRONTEND_URL=http://localhost:5173

# How long (seconds) a slot hold reserves a slot before expiry
SLOT_HOLD_SECONDS=120
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Database Schema

```
users
  id (PK, UUID)
  name, email (unique), password_hash
  role: patient | doctor | admin
  phone, created_at

doctor_profiles
  id (PK, UUID)
  user_id (FK → users.id, unique)
  specialisation, bio
  slot_duration_minutes (default 20)
  working_start, working_end (HH:MM)
  working_days (comma-separated weekday numbers, Mon=0)

doctor_leaves
  id (PK, UUID)
  doctor_id (FK → doctor_profiles.id)
  leave_date (Date)
  reason
  UNIQUE(doctor_id, leave_date)

appointments
  id (PK, UUID)
  patient_id (FK → users.id)
  doctor_id (FK → doctor_profiles.id)
  appointment_date (Date)
  start_time, end_time (HH:MM)
  status: booked | cancelled | completed | cancelled_by_leave
  symptoms_text, previsit_summary_json, previsit_llm_failed
  doctor_notes, prescription_text, postvisit_summary_text, postvisit_llm_failed
  patient_calendar_event_id, doctor_calendar_event_id
  UNIQUE(doctor_id, appointment_date, start_time, status)

slot_holds
  id (PK, UUID)
  doctor_id, appointment_date, start_time
  patient_id, expires_at
  UNIQUE(doctor_id, appointment_date, start_time)

medication_reminders
  id (PK, UUID)
  appointment_id (FK), patient_id (FK)
  medicine_name, remind_at, sent, send_attempts

email_logs
  id (PK, UUID)
  to_email, subject, body, category
  status: pending | sent | failed
  attempts, last_error, created_at

calendar_tokens
  id (PK, UUID)
  user_id (FK → users.id, unique)
  refresh_token, access_token, token_expiry
```

---

## API Documentation

All endpoints are prefixed `/api`. JWT token must be sent as `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new patient |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Any | Get current user info |

**Register body:** `{ name, email, password, phone? }`  
**Login body:** `{ email, password }`  
**Response:** `{ token, user: { id, name, email, role, phone } }`

---

### Patient

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/patient/doctors` | patient | Search doctors (`?specialisation=`) |
| GET | `/api/patient/doctors/:id/slots` | patient | Available slots for a date (`?date=YYYY-MM-DD`) |
| POST | `/api/patient/doctors/:id/hold` | patient | Hold a slot for 2 min |
| POST | `/api/patient/doctors/:id/book` | patient | Book appointment |
| GET | `/api/patient/appointments` | patient | List own appointments |
| POST | `/api/patient/appointments/:id/symptoms` | patient | Submit symptoms (triggers AI pre-visit summary) |
| POST | `/api/patient/appointments/:id/cancel` | patient | Cancel appointment |

**Book body:** `{ date, start_time, hold_id?, symptoms? }`  
**Symptoms body:** `{ symptoms }` — returns appointment with `previsit_summary` (JSON string)

---

### Doctor

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/doctor/profile` | doctor | Read own profile |
| PUT | `/api/doctor/profile` | doctor | Update working hours / bio |
| GET | `/api/doctor/appointments` | doctor | List appointments (`?date=YYYY-MM-DD`) |
| POST | `/api/doctor/appointments/:id/notes` | doctor | Submit post-visit notes + prescription |
| GET | `/api/doctor/leaves` | doctor | List own leave days |
| POST | `/api/doctor/leaves` | doctor | Add leave day (cancels existing bookings) |
| DELETE | `/api/doctor/leaves/:leave_id` | doctor | Remove a leave day |

**Notes body:** `{ notes, prescription? }` — triggers AI post-visit summary + medication reminders  
**Leave body:** `{ date, reason? }`

---

### Admin

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/doctors` | admin | Create doctor profile |
| GET | `/api/admin/doctors` | admin | List all doctors |
| PUT | `/api/admin/doctors/:id` | admin | Update doctor profile |
| DELETE | `/api/admin/doctors/:id` | admin | Delete doctor |
| POST | `/api/admin/doctors/:id/leave` | admin | Mark doctor on leave |
| GET | `/api/admin/doctors/:id/leaves` | admin | List doctor's leave days |
| DELETE | `/api/admin/doctors/:id/leaves/:leave_id` | admin | Remove a leave day |

---

### Google Calendar

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar/connect` | any | Get OAuth2 authorization URL |
| GET | `/api/calendar/oauth2callback` | Public | OAuth2 callback (redirect from Google) |
| GET | `/api/calendar/status` | any | Check if user has connected Calendar |
| DELETE | `/api/calendar/disconnect` | any | Revoke Calendar access |

---

## LLM Prompts

### Pre-visit summary (Groq → JSON)

```
Analyse these symptoms and return: urgency level (Low / Medium / High),
chief complaint, and three suggested questions for the doctor.
Symptoms: {symptoms}

Respond ONLY with valid JSON in exactly this shape, no markdown, no prose:
{"urgency": "Low|Medium|High", "chief_complaint": "...", "suggested_questions": ["...", "...", "..."]}
```

**Failure handling:** On any LLM error (timeout, bad JSON, missing API key), the system returns a fallback object with `urgency: "Medium"`, the raw symptoms as the chief complaint, and three generic questions. The `previsit_llm_failed` flag is set `true` so the UI can show a warning.

### Post-visit summary (Groq → Plain text)

```
Convert these clinical notes into a patient-friendly summary with
medication schedule and follow-up steps: {notes}

Write in plain, warm, non-technical language a patient can understand.
Use short sections: 'What the doctor found', 'Your medicines',
'Follow-up steps'. Keep it under 200 words.
```

**Failure handling:** Returns the raw notes with a friendly prefix. The `postvisit_llm_failed` flag is set `true`.

---

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g. "Sahayak Health")
3. Navigate to **APIs & Services → Library**, search **Google Calendar API**, enable it
4. Go to **APIs & Services → OAuth consent screen**:
   - User Type: **External**
   - Add your email as a test user
   - Scopes: add `https://www.googleapis.com/auth/calendar.events`
5. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/calendar/oauth2callback`
6. Copy the **Client ID** and **Client Secret** into your `.env`

> **Note:** While in "Testing" mode, only added test users can connect. For production, submit the app for Google verification.

**User flow:**
1. Patient/doctor clicks **Calendar** in the navbar
2. Frontend calls `GET /api/calendar/connect` → receives authorization URL
3. User opens the URL, grants permission on Google's site
4. Google redirects to `/api/calendar/oauth2callback` with a code
5. Backend exchanges code for tokens, stores refresh token in `calendar_tokens`
6. Future bookings create events on the user's Google Calendar automatically

---

## Email Setup

1. Enable 2-Step Verification on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use your Gmail address as `MAIL_USERNAME` and the 16-char App Password as `MAIL_PASSWORD`

**Reliability:** Every email is first written to `email_logs` with `status=pending`. If SMTP succeeds it's marked `sent`. If it fails, it's marked `failed` and a background job retries it every 2 minutes with up to 5 attempts.

---

## Deployment

### Backend (Render free tier)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn run:app`
5. Add all `.env` variables in the **Environment** tab

### Frontend (Vercel)

1. Import your repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend/`
3. Add `VITE_API_BASE_URL=https://your-render-backend-url.onrender.com`
4. Deploy

### Environment variable updates needed for production:
- `FRONTEND_URL` → your Vercel URL
- `GOOGLE_REDIRECT_URI` → `https://your-backend.onrender.com/api/calendar/oauth2callback`
- `SECRET_KEY` and `JWT_SECRET_KEY` → strong random strings
- `DATABASE_URL` → Postgres connection string (Render free Postgres or Neon/Supabase)
