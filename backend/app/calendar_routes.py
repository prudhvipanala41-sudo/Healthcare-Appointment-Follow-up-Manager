"""
Google Calendar OAuth2 connect flow.

Flow: frontend hits /api/calendar/connect (JWT-protected) which returns a
Google consent URL. User approves on Google's site, Google redirects back to
/api/calendar/oauth2callback with a `code` + our `state` (the user id). We
exchange the code for tokens and store the refresh token on CalendarToken.
Connecting Calendar is optional — everything else works without it.
"""
from flask import Blueprint, current_app, jsonify, redirect, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from google_auth_oauthlib.flow import Flow

from app.extensions import db
from app.models import CalendarToken

bp = Blueprint("calendar", __name__, url_prefix="/api/calendar")

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


@bp.get("/debug-redirect")
def debug_redirect():
    """Temporary debug endpoint - shows exactly what redirect URI would be sent to Google."""
    host = request.host
    scheme = "http" if ("localhost" in host or "127.0.0.1" in host) else "https"
    auto_detected = f"{scheme}://{host}/api/calendar/oauth2callback"
    return jsonify({
        "request_host": request.host,
        "request_host_url": request.host_url,
        "auto_detected_redirect_uri": auto_detected,
        "configured_redirect_uri": current_app.config.get("GOOGLE_REDIRECT_URI"),
    })


@bp.get("/test-email")
def test_email():
    """Debug endpoint - tests email sending and shows exact config and error."""
    try:
        from app.notifications.email_service import _send_smtp
        cfg = current_app.config
        username = cfg.get("MAIL_USERNAME") or ""
        password = cfg.get("MAIL_PASSWORD") or ""
        result = {
            "MAIL_SERVER": cfg.get("MAIL_SERVER"),
            "MAIL_PORT": cfg.get("MAIL_PORT"),
            "MAIL_USE_TLS": cfg.get("MAIL_USE_TLS"),
            "MAIL_USERNAME": username,
            "MAIL_PASSWORD_SET": bool(password),
            "MAIL_DEFAULT_SENDER": cfg.get("MAIL_DEFAULT_SENDER"),
        }
        if not username:
            result["status"] = "FAILED"
            result["error"] = "MAIL_USERNAME is not set in environment variables!"
            return jsonify(result)

        _send_smtp(
            username,
            "Sahayak Health - Test Email",
            "This is a test email from Sahayak Health! If you received this, your email configuration is 100% working!"
        )
        result["status"] = "SUCCESS - email sent to " + username
    except Exception as exc:
        result = {"status": "FAILED", "error": str(exc), "type": type(exc).__name__}
    return jsonify(result)


@bp.get("/email-logs")
def email_logs():
    """Live audit trail of all emails dispatched by the system."""
    from app.models import EmailLog
    logs = EmailLog.query.order_by(EmailLog.created_at.desc()).limit(10).all()
    return jsonify([
        {
            "id": l.id,
            "to_email": l.to_email,
            "subject": l.subject,
            "category": l.category,
            "status": l.status,
            "attempts": l.attempts,
            "last_error": l.last_error,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ])




def _get_redirect_uri():
    """Guaranteed production redirect URI matching Google Cloud Console exactly."""
    host = request.headers.get("X-Forwarded-Host", request.host)
    if "localhost" in host or "127.0.0.1" in host:
        return "http://localhost:5000/api/calendar/oauth2callback"
    # In all production environments, return the exact registered Render HTTPS URL:
    return "https://healthcare-appointment-follow-up-manager-xpk2.onrender.com/api/calendar/oauth2callback"




def _flow():
    redirect_uri = _get_redirect_uri()
    client_config = {
        "web": {
            "client_id": current_app.config["GOOGLE_CLIENT_ID"],
            "client_secret": current_app.config["GOOGLE_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }
    return Flow.from_client_config(client_config, scopes=SCOPES, redirect_uri=redirect_uri)


@bp.get("/connect")
@jwt_required()
def connect():
    if not current_app.config["GOOGLE_CLIENT_ID"]:
        return jsonify({"error": "Google Calendar is not configured on this server"}), 501
    flow = _flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline", include_granted_scopes="true", prompt="consent", state=get_jwt_identity()
    )
    return jsonify({"authorization_url": auth_url})


@bp.get("/oauth2callback")
def oauth2callback():
    # Handle user denial or other errors from Google
    error = request.args.get("error")
    if error:
        frontend_url = current_app.config["FRONTEND_URL"]
        return redirect(f"{frontend_url}/?calendar_error={error}")

    state = request.args.get("state")
    code = request.args.get("code")
    if not state or not code:
        return jsonify({"error": "missing state or code"}), 400

    try:
        flow = _flow()
        flow.fetch_token(code=code)
        creds = flow.credentials
    except Exception as exc:
        current_app.logger.error("OAuth2 token exchange failed: %s", exc)
        return redirect(f"{current_app.config['FRONTEND_URL']}/?calendar_error=token_exchange_failed")

    token = CalendarToken.query.filter_by(user_id=state).first()
    if not token:
        token = CalendarToken(user_id=state, refresh_token=creds.refresh_token)
        db.session.add(token)
    else:
        token.refresh_token = creds.refresh_token or token.refresh_token
    token.access_token = creds.token
    token.token_expiry = creds.expiry
    db.session.commit()

    return redirect(f"{current_app.config['FRONTEND_URL']}/?calendar=connected")


@bp.get("/status")
@jwt_required()
def status():
    token = CalendarToken.query.filter_by(user_id=get_jwt_identity()).first()
    return jsonify({"connected": token is not None})


@bp.delete("/disconnect")
@jwt_required()
def disconnect():
    """Revoke calendar access — removes the stored tokens."""
    token = CalendarToken.query.filter_by(user_id=get_jwt_identity()).first()
    if token:
        db.session.delete(token)
        db.session.commit()
    return jsonify({"message": "Google Calendar disconnected."})
