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
        from app.notifications.scheduler import init_scheduler
        init_scheduler(app)

    return app
