from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.extensions import db
from app.models.event_model import EventParticipant, Match, Category, MatchParticipant, MatchRelation, Event, ParticipantCategory
from app.schemas.event_schema import event_schema
from app.utils.response import error_response, success_response
from app.services.roles_service import manager_required, club_owner_required, club_in_event_required
from . import event_bp
import math, random
from sqlalchemy.orm import joinedload
from collections import defaultdict

@event_bp.route("/<int:event_id>/categories/<int:category_id>/matches", methods=["POST"])
@club_owner_required(from_event=True)  # organizer check will be enforced inside
def create_match(event_id, category_id, club):
    """
    Create a match within a category. Only the organizer's club can do this.
    """
    # ✅ Only the organizer club can create matches
    event = Event.query.get(event_id)
    if event.organizer_id != club.id:
        return error_response({"message": "Only the organizer can create matches"}, 403)

    data = request.get_json()
    
    participants = data.get("participants", [])  # list of participant IDs
    round_name = data.get("round", None)
    match_number = data.get("match_number", None)

    if not category_id:
        return error_response({"message": "category_id is required"}, 400)

    # Ensure category exists
    category = Category.query.filter_by(id=category_id, event_id=event_id).first()
    if not category:
        return error_response({"message": "Category not found in this event"}, 404)
    
    if not category.can_sign_up and category.is_bracket:
        return error_response({"message": "Matches cannot be added to bracket"}, 400)

    if not category.can_sign_up:
        return error_response({"message": "No more matches can be added"}, 400)
    
    
    # Create match
    match = Match(
        category_id=category_id,
        round=round_name,
        match_number=match_number,
        status="scheduled"
    )
    db.session.add(match)
    db.session.flush()  # get match.id before committing

    # Add participants
    for p in participants:
        participant = EventParticipant.query.get(p)
        if not participant:
            return error_response({"error": f"Participant {p} not found"}, 404)
        mp = MatchParticipant(match_id=match.id, participant_id=p)
        db.session.add(mp)
    category.is_bracket = False
    db.session.commit()

    return success_response({
        "id": match.id,
        "category_id": match.category_id,
        "round": match.round,
        "match_number": match.match_number,
        "participants": [p.id for p in match.participants]
    }, 201)


def next_power_of_two(x: int) -> int:
    return 1 if x == 0 else 2 ** math.ceil(math.log2(x))

@event_bp.route("/<int:event_id>/categories/<int:category_id>/bracket", methods=["POST"])
@club_owner_required(from_event=True)
def create_bracket(event_id, category_id, club):
    # ✅ Only the organizer club can create matches
    event = Event.query.get(event_id)
    if event.organizer_id != club.id:
        return error_response({"message": "Only the organizer can create matches"}, 403)

    category = Category.query.get(category_id)
    if not category.is_bracket:
        return error_response({"message": "This category is not for a bracket"}, 400)
    
    if category.matches and len(category.matches) > 0:
        return error_response({"message": "Bracket already created"}, 400)

    data = request.get_json()
    matches_data = data["matches"]
    relations_data = data.get("relations", [])
    match_number_to_id = {}

    # Step 1: Create matches
    for m in matches_data:
        match = Match(category_id=category_id, round=m["round"], match_number=m["match_number"])
        db.session.add(match)
        db.session.flush()  # assigns ID
        match_number_to_id[m["match_number"]] = match.id

        # Add participants
        for p in m["participants"]:
            # Find the association row
            pc = ParticipantCategory.query.filter_by(
                participant_id=p["participant_id"],
                category_id=category_id
            ).first()
            if not pc:
                # if it doesn't exist, create it
                pc = ParticipantCategory(
                    participant_id=p["participant_id"],
                    category_id=category_id,
                    seed=p["seed"]
                )
                db.session.add(pc)
            else:
                pc.seed = p["seed"]
            mp = MatchParticipant(
                match_id=match.id,
                participant_id=p["participant_id"],
                position=p.get("position"),
                role=p.get("role", "competitor")
            )
            db.session.add(mp)

    # Step 2: Create relations
    for r in relations_data:
        source_id = match_number_to_id[r["source_match_number"]]
        target_id = match_number_to_id[r["target_match_number"]]
        rel = MatchRelation(source_match_id=source_id, target_match_id=target_id, qualifier_rank=r.get("qualifier_rank", 1))
        db.session.add(rel)
    category.can_sign_up = False
    db.session.commit()
    return success_response({"message": "Bracket created"})

@event_bp.route("/matches/<int:match_id>/winner", methods=["PATCH"])
@club_owner_required(from_event=True)
def set_winner(match_id):
    """
    Set the winner of a match and advance them through the bracket.
    Only managers and club owners can set match winners.
    """
    data = request.get_json() or {}
    winner_id = data.get("winner_id")

    if not winner_id:
        return error_response({"error": "winner_id is required"}, 400)

    # Get match with category information
    match = Match.query.options(
        joinedload(Match.category)
    ).get(match_id)
    
    if not match:
        return error_response({"error": "Match not found"}, 404)

    # Ensure this is a bracket match
    if not match.category.is_bracket:
        return error_response({"error": "Winner can only be set for bracket matches"}, 400)

    # Check if match is already completed
    if match.status == "completed":
        return error_response({"error": "Match is already completed"}, 400)

    winner = EventParticipant.query.get(winner_id)
    if not winner:
        return error_response({"error": "Winner participant not found"}, 404)

    # Ensure the winner is actually in this match
    winner_mp = MatchParticipant.query.filter_by(match_id=match.id, participant_id=winner.id).first()
    if not winner_mp:
        return error_response({"error": "This participant is not in the given match"}, 400)

    # Mark this match as completed and set winner
    match.status = "completed"
    winner_mp.rank = 1
    winner_mp.result_type = "win"

    # Set all other participants as losers
    other_participants = MatchParticipant.query.filter(
        MatchParticipant.match_id == match.id,
        MatchParticipant.participant_id != winner.id
    ).all()
    
    for i, other_mp in enumerate(other_participants, start=2):
        other_mp.rank = i
        other_mp.result_type = "loss"

    # Advance participants to next round(s) based on qualifier_rank
    advanced_matches = []
    for rel in match.next_match_links:  # relations where this match is a source
        target_match = rel.target_match
        
        # Find the participant who should advance based on qualifier_rank
        advancing_participant = None
        if rel.qualifier_rank == 1:  # Winner advances
            advancing_participant = winner
        else:  # Runner-up or other rank advances
            advancing_mp = MatchParticipant.query.filter_by(
                match_id=match.id, 
                rank=rel.qualifier_rank
            ).first()
            if advancing_mp:
                advancing_participant = advancing_mp.participant
        
        if advancing_participant:
            # Check if participant is already in the target match
            existing_mp = MatchParticipant.query.filter_by(
                match_id=target_match.id,
                participant_id=advancing_participant.id
            ).first()
            
            if not existing_mp:
                # Add participant to target match
                new_mp = MatchParticipant(
                    match_id=target_match.id,
                    participant_id=advancing_participant.id,
                    role="competitor"
                )
                db.session.add(new_mp)
                advanced_matches.append({
                    "match_id": target_match.id,
                    "participant_id": advancing_participant.id,
                    "qualifier_rank": rel.qualifier_rank
                })

    try:
        db.session.commit()
        
        return success_response({
            "message": "Winner set and participants advanced",
            "match_id": match.id,
            "winner_id": winner.id,
            "match_status": match.status,
            "advanced_to_matches": advanced_matches,
            "total_advanced": len(advanced_matches)
        }, 200)
        
    except Exception as e:
        db.session.rollback()
        return error_response({"error": f"Failed to update match: {str(e)}"}, 500)

@event_bp.route("/categories/<int:category_id>/bracket", methods=["GET"])
def get_category_bracket(category_id: int):
    # Load category with matches, participants, and match participants
    category = Category.query.options(
        joinedload(Category.matches)
            .joinedload(Match.participants)
            .joinedload(MatchParticipant.participant),
        joinedload(Category.participant_categories)
            .joinedload(ParticipantCategory.participant)
    ).filter_by(id=category_id).first_or_404()


    matches = category.matches
    match_ids = [m.id for m in matches]

    # Build source map for relations
    source_map: dict[int, list[int]] = defaultdict(list)
    for r in MatchRelation.query.filter(MatchRelation.target_match_id.in_(match_ids)).all():
        source_map[r.target_match_id].append(r.source_match_id)

    # Map participant ID to seed for this category
    participant_seed_map = {
        pc.participant_id: pc.seed
        for pc in category.participant_categories
    }

    # Group matches by round
    rounds_dict: dict[int, list[dict]] = defaultdict(list)
    for m in matches:
        match_data = {
            "id": m.id,
            "round": m.round,
            "match_number": m.match_number,
            "hidden": False,  # adjust if needed
            "sourceIds": source_map.get(m.id, []),
            "slots": [
                {
                    "id": mp.participant.id,
                    "name": mp.participant.name,
                    "score": mp.score,
                    "seed": participant_seed_map.get(mp.participant.id)
                } for mp in m.participants
            ]
        }
        rounds_dict[m.round].append(match_data)

    sorted_rounds = [rounds_dict[r] for r in sorted(rounds_dict)]

    # List of participants in the category with seeds
    participants_with_seeds = [
        {
            "id": p.id,
            "name": p.name,
            "seed": getattr(p, 'seed', None)
        }
        for p in category.participants
    ]

    return success_response({
        "matches": sorted_rounds,
        "participants": participants_with_seeds
    })


@event_bp.route("/matches/clear_matches", methods=["DELETE"])
def clear_matches():
    try:
        num_deleted = db.session.query(Match).delete()
        db.session.query(MatchParticipant).delete()
        db.session.query(MatchRelation).delete()
        # db.session.query(ParticipantCategory).delete()
        # db.session.query(EventParticipant).delete()
        db.session.commit()
        return success_response({"message": f"Deleted {num_deleted} matches"}, 200)
    except Exception as e:
        db.session.rollback()
        return success_response({"error": str(e)}, 500)