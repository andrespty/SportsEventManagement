from flask import request
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.event_model import Event, EventJoinRequest, EventParticipant, EventJoinLink
from app.models.user_model import Club
from app.schemas.event_schema import event_schema, join_requests_schema
from app.utils.response import error_response, success_response
from app.services.events_service import create_join_link
from app.services.roles_service import manager_required, club_owner_required, club_in_event_required, is_owner_required
from . import event_bp
import datetime
from sqlalchemy.orm import joinedload

# ---- Create request to join an event (club owners only) ----
@event_bp.route("/<int:event_id>/request-join", methods=["POST"])
@is_owner_required
def request_join_event(event_id, owned_clubs):
    """
    Join event request
    Any Club can request to join
    Request must be sent by Club owner
    """
    data = request.get_json()
    if not data or "club_ids" not in data:
        return error_response({"message": "club_ids list is required"}, 400)

    club_ids = data["club_ids"]
    if not isinstance(club_ids, list) or not all(isinstance(c, int) for c in club_ids):
        return error_response({"message": "club_ids must be a list of integers"}, 400)

    club_ids = list(set(club_ids))

    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    created_requests = []
    for club in owned_clubs:
        if club.id not in club_ids:
            continue

        # Already participating?
        if club in event.participating_clubs:
            return error_response({"message": f"Already participating"}, 400)

        # Already requested?
        existing_request = EventJoinRequest.query.filter_by(
            event_id=event.id, club_id=club.id, status="pending"
        ).first()
        if existing_request:
            return error_response({"message": "Waiting for approval"}, 400)

        join_request = EventJoinRequest(event_id=event.id, club_id=club.id)
        db.session.add(join_request)
        created_requests.append({"club_id": club.id, "club_name": club.name})

    if not created_requests:
        return error_response({"message": "No valid join requests created"}, 400)

    db.session.commit()
    return success_response({
        "requests": created_requests
    }, 201)

# ---- Approve a join request (organizer only) ----
@event_bp.route("/<int:event_id>/join-requests/<int:request_id>/<string:action>", methods=["POST"])
@club_owner_required(from_event=True)
def approve_join_request(event_id, request_id, action, club):
    """
    Approve or reject a join request.
    Only event organizer can authorize.
    """
    user_id = int(get_jwt_identity())
    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    # Organizer check
    if event.organizer.owner_id != user_id:
        return error_response({"message": "Only the organizer can approve requests"}, 403)

    join_request = EventJoinRequest.query.get(request_id)
    if not join_request or join_request.event_id != event.id:
        return error_response({"message": "Join request not found"}, 404)

    if action not in ("accepted", "rejected"):
        return error_response({"message": "Invalid action"}, 400)

    join_request.status = action

    if action == "accepted":
        if join_request.club not in event.participating_clubs:
            event.participating_clubs.append(join_request.club)

    db.session.commit()

    message = "Club approved and added" if action == "accepted" else "Join request rejected"
    return success_response({"message": message}, 200)


# ---- Get all join requests from an event (organizer only) ----
@event_bp.route("/<int:event_id>/join-requests", methods=["GET"])
@club_owner_required(from_event=True)
def get_event_requests(event_id, club):
    """
    List all pending join requests for this event.
    Only the organizer's club can access.
    """
    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    # Query only pending join requests and eager-load the club
    pending_requests = (
        EventJoinRequest.query
        .options(joinedload(EventJoinRequest.club))
        .filter_by(event_id=event.id, status="pending")
        .all()
    )

    requests_data = join_requests_schema.dump(pending_requests)

    return success_response({
        "event_id": event.id,
        "event_name": event.name,
        "join_requests": requests_data
    })

# ---- Create join link  ----
@event_bp.route("/<int:event_id>/generate-link", methods=["POST"])
@club_owner_required(from_event=True)
def generate_event_link(event_id, club):
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    if event.organizer.owner_id != user_id:
        return error_response({"message": "Not authorized"}, 403)

    link = create_join_link(event_id)
    return success_response({
        "token": link.token,
        "url": f"/events/join/{link.token}"
    })

# ---- Join Link info ----
@event_bp.route("/join/<string:token>", methods=["GET"])
@is_owner_required
def verify_join_link(token, owned_clubs):
    user_id = int(get_jwt_identity())

    link = EventJoinLink.query.filter_by(token=token).first()
    if not link or (link.expires_at and link.expires_at < datetime.utcnow()):
        return error_response({"message": "Link expired or invalid"}, 404)

    # Check if user is an owner of some club
    user_club = Club.query.filter_by(owner_id=user_id).all()
    if not user_club or len(user_club) == 0:
        return error_response({"message": "You are not a club owner"}, 403)

    # Return info needed for the join page
    return success_response({
        "event_id": link.event_id,
        "event_name": link.event.name,
        "clubs": [
            {
                "id": club.id, "name": club.name
            }
            for club in user_club
        ]
    })
