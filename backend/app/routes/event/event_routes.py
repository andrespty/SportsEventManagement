# routes/event_routes.py
from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.extensions import db
from app.models.event_model import Event, EventJoinRequest, EventParticipant
from app.models.user_model import Club
from app.schemas.event_schema import event_schema, events_schema
from app.utils.response import error_response, success_response
from app.services.roles_service import manager_required, club_owner_required, club_in_event_required
from . import event_bp
from flask import make_response
from flask_cors import cross_origin

@event_bp.route("/<int:club_id>/create", methods=["POST"])
@club_owner_required("club_id") 
def create_event(club_id, club):         
    data = request.get_json()

    if not data or "name" not in data:
        return error_response({"message": "Name and date are required"}, 400)

    event = Event(
        name=data["name"],
        organizer_id=club.id
    )
    db.session.add(event)
    db.session.commit()

    return success_response(event_schema.dump(event), 201)

@event_bp.route("/<int:event_id>", methods=["GET"])
def get_event(event_id):
    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)
    
    return success_response(event_schema.dump(event))

@event_bp.route("/participating", methods=["GET"])
@jwt_required()
def get_participating_events():
    user_id = int(get_jwt_identity())

    # Get clubs owned by this user
    clubs = Club.query.filter_by(owner_id=user_id).all()
    if not clubs:
        return success_response([], 200)  # no clubs, return empty list

    club_ids = [club.id for club in clubs]

    # Query events where these clubs are participants
    events = (
        Event.query.join(Event.participating_clubs)
        .filter(Club.id.in_(club_ids))
        .all()
    )

    return success_response(events_schema.dump(events))


@event_bp.route("/", methods=["GET"])
@jwt_required()
def get_club_events():
    user_id = int(get_jwt_identity())

    # Get clubs owned by this user
    clubs = Club.query.filter_by(owner_id=user_id).all()
    if not clubs:
        return success_response([], 200)  # no clubs, return empty list

    club_ids = [club.id for club in clubs]

    # Query all events for those clubs
    events = Event.query.filter(Event.organizer_id.in_(club_ids)).all()

    return success_response(events_schema.dump(events))

