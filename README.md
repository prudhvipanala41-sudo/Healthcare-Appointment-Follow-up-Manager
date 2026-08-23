<div align="center">
  <img src="https://img.icons8.com/color/96/000000/medical-doctor.png" alt="Sahayak Health Logo" width="80"/>
  <h1>Sahayak Health</h1>
  <p><strong>A Next-Generation AI-Powered Healthcare Appointment & Follow-Up Manager</strong></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-blue" alt="Frontend Badge"/>
  <img src="https://img.shields.io/badge/Backend-Python%20%7C%20Flask-green" alt="Backend Badge"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blueviolet" alt="Database Badge"/>
  <img src="https://img.shields.io/badge/AI-Groq%20LLM-orange" alt="AI Badge"/>
</p>

---

## 🌟 Overview

**Sahayak Health** is a comprehensive, full-stack digital healthcare platform designed to bridge the gap between patients, doctors, and clinic administrators. Built with modern web technologies, it streamlines the entire consultation lifecycle—from searching for specialists and booking appointments to AI-assisted symptom analysis and automated calendar syncs.

### 🚀 Live Demo
- **Frontend (Vercel):** [https://healthcare-appointment-follow-up-ma-alpha.vercel.app](https://healthcare-appointment-follow-up-ma-alpha.vercel.app)
- **Backend (Render):** `https://healthcare-appointment-follow-up-manager-xpk2.onrender.com`

---

## ✨ Key Features

### 🧑‍⚕️ For Patients
- **Smart Discovery:** Browse and filter verified doctors by specialization, location, or hospital.
- **Instant Booking:** Book appointments securely with background slot-holds preventing double-bookings.
- **AI Pre-Visit Summaries:** Describe your symptoms before booking; our AI instantly generates an Urgency Level, Chief Complaint, and suggested questions for your doctor.
- **Google Calendar Sync:** Appointments are automatically added to your Google Calendar with a Meet link.
- **Health Records:** Access your past appointments, prescriptions, and AI-generated, patient-friendly post-visit summaries in one place.

### 🩺 For Doctors
- **Availability Management:** Set custom working hours, slot durations, and schedule ad-hoc leaves.
- **Appointment Dashboard:** Accept or reject incoming appointment requests and review the patient's AI pre-visit summary *before* the consultation.
- **Post-Consultation AI Workflow:** Write quick technical notes and prescriptions. The AI automatically translates these into easy-to-understand post-visit summaries for the patient.

### 🛡️ For Administrators
- **System Oversight:** View high-level platform analytics (total patients, doctors, and appointments).
- **User & Doctor Management:** Onboard new doctors, verify credentials, and safely manage or remove user accounts.
- **Hospital Directory:** Add and manage hospital profiles and locations.

### 📧 Automated Notifications
- **SMTP/Resend Integration:** Real-time email notifications for Registrations, Appointment Requests (Pending), Confirmations, and Rejections.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router DOM
- **Backend:** Python 3, Flask, SQLAlchemy (ORM), APScheduler (Background Tasks)
- **Database:** SQLite (Local Development) / PostgreSQL (Production)
- **External Integrations:**
  - **Groq API (`qwen/qwen3.6-27b`):** Lightning-fast LLM inference for AI summaries.
  - **Google OAuth 2.0 & Calendar API:** For two-way calendar sync and Meet link generation.
  - **SMTP / Flask-Mail:** For asynchronous email dispatch queues.

---

## 🛠️ Local Installation & Setup

Follow these steps to run Sahayak Health locally on your machine.

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL (Optional, defaults to SQLite)

### 1. Clone the Repository
```bash
git clone https://github.com/prudhvipanala41-sudo/Healthcare-Appointment-Follow-up-Manager.git
cd Healthcare-Appointment-Follow-up-Manager
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your credentials
# (Copy from .env.example or use the provided defaults)
# Required: SECRET_KEY, JWT_SECRET_KEY, GROQ_API_KEY, MAIL credentials

# Initialize the database and seed dummy data
python seed.py

# Run the Flask server
python run.py
```
*The backend will run on `http://localhost:5000`*

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Run the Vite development server
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🔑 Default Demo Credentials
Use these to log into the system locally or on the live demo to test the different roles:

- **Patient:** `patient@demo.com` | `Patient@123`
- **Doctor:** `dr.asha@clinic.com` | `Doc@123`
- **Admin:** `admin@demo.com` | `Admin@123`

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/prudhvipanala41-sudo/Healthcare-Appointment-Follow-up-Manager/issues).

---

<div align="center">
  <p>Built with ❤️ for the Hackathon</p>
</div>
