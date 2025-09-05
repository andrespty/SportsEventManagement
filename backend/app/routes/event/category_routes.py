from flask import request
from app.utils.response import success_response, error_response
from app.services.roles_service import club_owner_required
from app.extensions import db
from app.models.event_model import Event, Category, EventParticipant
from app.schemas.event_schema import event_schema
from app.services.roles_service import manager_required, club_owner_required, club_in_event_required
from . import event_bp

# ---- List categories ----
@event_bp.route("/<int:event_id>/categories", methods=["GET"])
def list_categories(event_id):
    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    categories = Category.query.filter_by(event_id=event.id).all()
    data = [{"id": c.id, "name": c.name} for c in categories]

    return success_response({"event_id": event.id, "categories": data})

# ---- Create category (organizer only) ----
@event_bp.route("/<int:event_id>/categories", methods=["POST"])
@club_owner_required(from_event=True)  # only event organizer allowed
def create_category(event_id, club):
    event = Event.query.get(event_id)
    if not event:
        return error_response({"message": "Event not found"}, 404)

    data = request.get_json()
    if not data or "name" not in data:
        return error_response({"message": "Category name is required"}, 400)

    category = Category(name=data["name"], event_id=event.id, order=data['order'])
    db.session.add(category)
    db.session.commit()

    return success_response({"id": category.id, "name": category.name, "event_id": event.id}, 201)


# ---- Get category by ID ----
@event_bp.route("/<int:event_id>/categories/<int:category_id>", methods=["GET"])
def get_category(event_id, category_id):
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found"}, 404)

    return success_response({"id": category.id, "name": category.name, "event_id": category.event_id})


# ---- Update category (organizer only) ----
@event_bp.route("/<int:event_id>/categories/<int:category_id>", methods=["PUT"])
@club_owner_required(from_event=True)
def update_category(event_id, category_id, club):
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found"}, 404)

    data = request.get_json()
    if not data or "name" not in data:
        return error_response({"message": "Category name is required"}, 400)

    category.name = data["name"]
    db.session.commit()

    return success_response({"id": category.id, "name": category.name, "event_id": category.event_id})


# ---- Delete category (organizer only) ----
@event_bp.route("/<int:event_id>/categories/<int:category_id>", methods=["DELETE"])
@club_owner_required(from_event=True)
def delete_category(event_id, category_id, club):
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found"}, 404)

    db.session.delete(category)
    db.session.commit()

    return success_response({"message": f"Category {category.name} deleted successfully"})

# ---- Add participant to category (club owners only) ----
@event_bp.route("/<int:event_id>/categories/<int:category_id>/participants/<int:participant_id>", methods=["POST"])
@club_in_event_required  # ensures user is the owner of a club in the event
def add_participant_to_category(event_id, category_id, participant_id, club, event):
    """
    Assign an event participant to a category.
    Only the owner of the participant's club can do this.
    """
    # Find category
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found in this event"}, 404)

    # Find participant
    participant = EventParticipant.query.filter_by(id=participant_id, event_id=event_id).first()
    if not participant:
        return error_response({"message": "Participant not found in this event"}, 404)

    # Ensure participant belongs to this club (security check)
    if participant.club_id != club.id:
        return error_response({"message": "You can only assign participants from your own club"}, 403)

    # Add relationship if not already present
    if participant not in category.participants:
        category.participants.append(participant)
        db.session.commit()

    return success_response({
        "message": f"Participant {participant.name} added to category {category.name}",
        "category_id": category.id,
        "participant_id": participant.id
    }, 201)

# ---- Delete participant from category (club owners only) ----
@event_bp.route("/<int:event_id>/categories/<int:category_id>/participants/<int:participant_id>", methods=["DELETE"])
@club_in_event_required  # ensures user is the owner of a club in the event
def remove_participant_from_category(event_id, category_id, participant_id, club, event):
    """
    Remove an event participant from a category.
    Only the owner of the participant's club can do this.
    """
    # Find category
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found in this event"}, 404)

    # Find participant
    participant = EventParticipant.query.filter_by(id=participant_id, event_id=event_id).first()
    if not participant:
        return error_response({"message": "Participant not found in this event"}, 404)

    # Ensure participant belongs to this club (security check)
    if participant.club_id != club.id:
        return error_response({"message": "You can only remove participants from your own club"}, 403)

    # Remove relationship if exists
    if participant in category.participants:
        category.participants.remove(participant)
        db.session.commit()
        return success_response({
            "message": f"Participant {participant.name} removed from category {category.name}",
            "category_id": category.id,
            "participant_id": participant.id
        })

    return error_response({"message": "Participant is not in this category"}, 400)

