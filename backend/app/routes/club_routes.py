from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user_model import Club, User
from app.schemas.user_schema import club_schema, clubs_schema
from app.services.roles_service import manager_required
from app.utils.response import * 

club_bp = Blueprint("clubs", __name__, url_prefix="/api/clubs")

# Create a club (protected)
@club_bp.route("/", methods=["POST"])
@manager_required
def create_club():
    data = request.get_json()
    name = data.get("name")
    owner_id = data.get("owner_id")

    if not name or not owner_id:
        return error_response({"message": "A field is missing"}, 400)

    owner = User.query.get(int(owner_id))
    if not owner:
        return error_response({"message": "User not found"}, 404)
    
    if len(owner.clubs) == 0:
        owner.isOwner = True

    club = Club(name=name, owner=owner)
    db.session.add(club)
    db.session.commit()

    return success_response(club_schema.dump(club), 201)

# List all clubs (public)
@club_bp.route("/", methods=["GET"])
def list_clubs():
    clubs = Club.query.all()
    return success_response(clubs_schema.dump(clubs), 200)
