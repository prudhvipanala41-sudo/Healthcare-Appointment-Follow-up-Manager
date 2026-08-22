from flask import Blueprint, jsonify, request
from app.models import Hospital

bp = Blueprint("hospitals", __name__, url_prefix="/api/hospitals")

@bp.get("/")
def list_hospitals():
    """List hospitals with optional filtering."""
    q = Hospital.query
    
    location = request.args.get("location")
    if location:
        q = q.filter(Hospital.location.ilike(f"%{location}%"))
        
    specialty = request.args.get("specialty")
    if specialty:
        q = q.filter(Hospital.specialities_text.ilike(f"%{specialty}%"))
        
    hospitals = q.order_by(Hospital.rating.desc()).all()
    return jsonify([h.to_dict() for h in hospitals])

@bp.get("/<hospital_id>")
def get_hospital(hospital_id):
    """Get hospital details including affiliated doctors."""
    hospital = Hospital.query.get_or_404(hospital_id)
    data = hospital.to_dict()
    
    # Include doctors
    data["doctors"] = [doc.to_dict() for doc in hospital.doctors]
    return jsonify(data)
