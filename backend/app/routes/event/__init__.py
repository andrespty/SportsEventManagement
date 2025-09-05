from flask import Blueprint

event_bp = Blueprint("event_bp", __name__, url_prefix="/api/events")

# Import sub-routes so they attach to the blueprint
from . import category_routes, event_routes, club_registration_routes, participants_routes, match_routes
