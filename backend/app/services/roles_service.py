from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.models.user_model import User, UserRole, Club
from app.models.event_model import Event
# from app.models.event_model import Club
from flask import jsonify, request
from app.utils.response import * 
from functools import wraps
from flask import make_response

# Role-based decorator
def manager_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            resp = make_response()
            resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
            resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin')
            return resp
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != UserRole.MANAGER:
            return error_response({"message": "Manager access required"}, 403)
        return fn(*args, **kwargs)
    return wrapper

def verify_manager_role(fn):
    """
    A decorator that checks if the authenticated user has a 'manager' role.
    This decorator should be applied *after* @jwt_required().
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # This wrapper will only be reached if a valid JWT is present
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or user.role != UserRole.MANAGER:
            return error_response({"message": "Manager access required"}, 403)
            
        return fn(*args, **kwargs)
    return wrapper

def user_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return error_response({"message": "User access required"}, 403)
        return fn(*args, **kwargs)
    return wrapper

def club_owner_required(param_name="club_id", from_event=False):
    """
    Ensures the current user owns the club.
    
    Args:
        param_name (str): the route parameter name for club_id (default "club_id")
        from_event (bool): if True, resolve the club via event.organizer_id instead
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = int(get_jwt_identity())

            # Case 1: Normal club action
            if not from_event:
                club_id = kwargs.get(param_name)
                if club_id is None:
                    return error_response({"message": "Club ID required"}, 400)
                club = Club.query.get(club_id)
                if not club:
                    return error_response({"message": "Club not found"}, 404)

            # Case 2: Organizer-mediated action via event
            else:
                event_id = kwargs.get("event_id")
                if event_id is None:
                    return error_response({"message": "Event ID required"}, 400)
                event = Event.query.get(event_id)
                if not event:
                    return error_response({"message": "Event not found"}, 404)
                club = event.organizer  # organizer is a Club instance

            # Ownership check
            if not club or club.owner_id != user_id:
                return error_response({"message": "You do not own this club"}, 403)

            # Inject club into endpoint for convenience
            kwargs["club"] = club
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def is_owner_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())

        # Check if the user owns any clubs
        owned_clubs = Club.query.filter_by(owner_id=user_id).all()
        if not owned_clubs:
            return jsonify({"message": "You do not own any clubs"}), 403

        # Inject the list of owned clubs for convenience
        kwargs["owned_clubs"] = owned_clubs

        return fn(*args, **kwargs)

    return wrapper


def club_in_event_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(event_id, club_id, *args, **kwargs):
        user_id = int(get_jwt_identity())
        club = Club.query.get(club_id)
        if not club or club.owner_id != user_id:
            return error_response({"message": "You do not own this club"}, 403)

        event = Event.query.get(event_id)
        if not event:
            return error_response({"message": "Event not found"}, 404)

        # Only organizer or approved participants can act
        if event.organizer_id != club.id and club not in event.participating_clubs:
            return error_response({"message": "Club is not part of this event"}, 403)

        kwargs["club"] = club
        kwargs["event"] = event
        return fn(event_id, club_id, *args, **kwargs)

    return wrapper