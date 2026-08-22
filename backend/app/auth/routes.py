from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required, decode_token
from datetime import timedelta

from app.extensions import db
from app.models import Role, User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "patient")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if role not in [r.value for r in Role]:
        return jsonify({"error": "invalid role"}), 400
    if role == "admin":
        return jsonify({"error": "admin accounts cannot self-register"}), 403
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    user = User(name=name, email=email, role=Role(role), phone=data.get("phone"))
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id, additional_claims={"role": user.role.value})
    return jsonify({"token": token, "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(identity=user.id, additional_claims={"role": user.role.value})
    return jsonify({"token": token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "not found"}), 404
    return jsonify(user.to_dict())


@bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        # Generate a stateless 1-hour token containing the user id in additional_claims
        reset_token = create_access_token(
            identity=user.id, 
            expires_delta=timedelta(hours=1),
            additional_claims={"type": "password_reset"}
        )
        
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        from app.notifications.email_service import queue_and_send_email
        queue_and_send_email(
            to_email=user.email,
            subject="Reset Your Password",
            body=f"Hello {user.name},\n\nPlease click the link below to reset your password. This link is valid for 1 hour.\n\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nSahayak Health Team",
            category="password_reset"
        )
    
    # Always return 200 to prevent email enumeration
    return jsonify({"message": "If that email exists in our system, a password reset link has been sent."})


@bp.post("/reset-password")
def reset_password():
    data = request.get_json(force=True)
    token = (data.get("token") or "").strip()
    new_password = (data.get("password") or "").strip()

    if not token or not new_password:
        return jsonify({"error": "token and new password are required"}), 400

    try:
        decoded = decode_token(token)
        if decoded.get("type") != "password_reset":
            return jsonify({"error": "invalid token type"}), 400
        
        user_id = decoded.get("sub")
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404
            
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password successfully reset."})
    except Exception as e:
        return jsonify({"error": "invalid or expired token"}), 400

