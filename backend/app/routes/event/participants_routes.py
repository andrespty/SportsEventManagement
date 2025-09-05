from flask import request
from app.extensions import db
from app.models.event_model import EventParticipant, Category, ParticipantCategory
from app.utils.response import error_response, success_response
from app.services.roles_service import manager_required, club_owner_required, club_in_event_required
from . import event_bp


@event_bp.route("/<int:event_id>/participants/<int:club_id>/add", methods=["POST"])
@club_in_event_required
def add_event_participant(event_id, club_id, club, event):
    """
    Add a participant to an event under the specified club.
    Only allowed if the club is the organizer or has been accepted as a participant.
    """
    data = request.get_json()
    if not data or "name" not in data:
        return error_response({"message": "Participant name is required"}, 400)

    participant = EventParticipant(
        name=data["name"],
        event_id=event.id,
        club_id=club.id
    )
    db.session.add(participant)
    db.session.flush()  # ensures participant.id is available

    # handle categories if provided (list of IDs)
    if "category_ids" in data and isinstance(data["category_ids"], list):
        for cat_id in data["category_ids"]:
            category = Category.query.filter_by(id=cat_id, event_id=event_id).first()
            if not category:
                continue  # skip missing or mismatched categories

            pc = ParticipantCategory(
                participant_id=participant.id,
                category_id=category.id
            )
            db.session.add(pc)

    db.session.commit()

    return success_response({
        "id": participant.id,
        "name": participant.name,
        "points": participant.points,
        "club_id": participant.club_id,
        "categories": [
            {
                "id": pc.category_id,
                "seed": pc.seed
            }
            for pc in participant.participant_categories
        ]
    }, 201)


@event_bp.route("/<int:event_id>/participants/<int:club_id>/remove/<int:participant_id>", methods=["DELETE"])
@club_in_event_required
def delete_event_participant(event_id, club_id, participant_id, club, event):
    """
    Delete an event participant.
    Only the owner of the club that registered the participant can delete them.
    """
    participant = EventParticipant.query.get(participant_id)
    if not participant:
        return error_response({"message": "Participant not found"}, 404)

    # Ensure participant belongs to this event and this club
    if participant.event_id != event.id or participant.club_id != club.id:
        return error_response({"message": "Participant does not belong to this club in this event"}, 403)

    participant.categories.clear()
    db.session.delete(participant)
    db.session.commit()

    return success_response({"message": f"Participant {participant.name} deleted successfully"})

@event_bp.route("/participants/categories/clear", methods=["DELETE"])
def clear_participant_categories():
    """
    Clear all participant-category relationships.
    Use with caution: this wipes the entire participant_categories table.
    """
    from sqlalchemy import text
    db.session.execute(text("DELETE FROM participant_categories"))
    db.session.commit()
    return success_response({"message": "All participant-category relationships cleared"})
