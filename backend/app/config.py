import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    _default_sqlite_path = os.path.join(BASE_DIR, "healthcare.db")
    _env_db_url = os.getenv("DATABASE_URL")
    if _env_db_url and _env_db_url.startswith("sqlite:///") and not _env_db_url.startswith("sqlite:////"):
        # Resolve relative sqlite paths against the backend/ dir (not Flask's
        # instance/ folder, which is a common source of "empty DB" confusion).
        _relative_name = _env_db_url.replace("sqlite:///", "", 1)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, _relative_name)}"
    else:
        SQLALCHEMY_DATABASE_URI = _env_db_url or f"sqlite:///{_default_sqlite_path}"
        if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
            SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.6-27b")

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", os.getenv("MAIL_USERNAME", ""))

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5000/api/calendar/oauth2callback")

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    SLOT_HOLD_SECONDS = int(os.getenv("SLOT_HOLD_SECONDS", 120))
