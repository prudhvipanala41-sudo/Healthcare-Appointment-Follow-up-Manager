import logging

from flask import Flask, jsonify

from app.config import Config
from app.extensions import cors, db, jwt, mail


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    logging.basicConfig(level=logging.INFO)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)


    from app.auth.routes import bp as auth_bp
    from app.admin.routes import bp as admin_bp
    from app.patient.routes import bp as patient_bp
    from app.doctor.routes import bp as doctor_bp
    from app.calendar_routes import bp as calendar_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(calendar_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception("Unhandled server error")
        return jsonify({"error": "internal server error"}), 500

    with app.app_context():
        db.create_all()
        
        # 1. Run dynamic schema migrations for PostgreSQL / SQLite
        from sqlalchemy import text
        dialect = db.engine.dialect.name
        columns = [
            ("doctor_profiles", "bio", "TEXT DEFAULT ''"),
            ("doctor_profiles", "qualifications", "VARCHAR(255) DEFAULT 'MBBS, MD'"),
            ("doctor_profiles", "experience_years", "INTEGER DEFAULT 10"),

            ("doctor_profiles", "hospital_name", "VARCHAR(255) DEFAULT 'City Multispeciality Hospital'"),
            ("doctor_profiles", "location", "VARCHAR(100) DEFAULT 'Bengaluru'"),
            ("doctor_profiles", "consultation_fee", "INTEGER DEFAULT 800"),
            ("doctor_profiles", "consultation_mode", "VARCHAR(50) DEFAULT 'Online & In-Clinic'"),
            ("doctor_profiles", "languages", "VARCHAR(255) DEFAULT 'English, Hindi'"),
            ("doctor_profiles", "expertise", "TEXT DEFAULT ''"),
            ("doctor_profiles", "research_interests", "TEXT DEFAULT ''"),
            ("doctor_profiles", "publications", "TEXT DEFAULT ''"),
            ("doctor_profiles", "rating", "FLOAT DEFAULT 4.8"),
            ("doctor_profiles", "review_count", "INTEGER DEFAULT 45"),
            ("doctor_profiles", "verification_status", "VARCHAR(50) DEFAULT 'Verified Specialist'"),
            ("doctor_profiles", "image_url", "VARCHAR(500) DEFAULT ''"),
            ("doctor_profiles", "source_url", "VARCHAR(500) DEFAULT ''"),
        ]
        for table, col, col_type in columns:
            try:
                if dialect == "postgresql":
                    db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                elif dialect == "sqlite":
                    try:
                        db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                    except Exception:
                        pass
                db.session.commit()
            except Exception:
                db.session.rollback()

        if dialect == "postgresql":
            try:
                db.session.execute(text("ALTER TABLE calendar_tokens ALTER COLUMN refresh_token DROP NOT NULL;"))
                db.session.commit()
            except Exception:
                db.session.rollback()

        # 2. Populate / Update Doctors
        try:
            from app.doctors_data import DOCTORS_DATA
            from app.models import User, DoctorProfile, Role
            if DoctorProfile.query.count() < len(DOCTORS_DATA):
                admin = User.query.filter_by(email="admin@clinic.com").first()
                if not admin:
                    admin = User(name="Clinic Admin", email="admin@clinic.com", role=Role.ADMIN)
                    admin.set_password("Admin@123")
                    db.session.add(admin)

                patient = User.query.filter_by(email="prudhvipanala41@gmail.com").first()
                if not patient:
                    patient = User(name="Demo Patient", email="prudhvipanala41@gmail.com", role=Role.PATIENT)
                    patient.set_password("Patient@123")
                    db.session.add(patient)

                for data in DOCTORS_DATA:
                    user = User.query.filter_by(email=data["email"]).first()
                    if not user:
                        user = User(name=data["name"].replace("Dr. ", ""), email=data["email"], role=Role.DOCTOR)
                        user.set_password("Doctor@123")
                        db.session.add(user)
                        db.session.flush()

                    profile = DoctorProfile.query.filter_by(user_id=user.id).first()
                    if not profile:
                        profile = DoctorProfile(user_id=user.id, specialisation=data["specialisation"])
                        db.session.add(profile)

                    for k, v in data.items():
                        if k not in ["name", "email"] and hasattr(profile, k):
                            setattr(profile, k, v)

                db.session.commit()
                app.logger.info("Auto-seeded %s multi-specialty doctors!", len(DOCTORS_DATA))
        except Exception as exc:
            app.logger.warning("Auto-seed check note: %s", exc)

        from app.notifications.scheduler import init_scheduler
        init_scheduler(app)

    return app


