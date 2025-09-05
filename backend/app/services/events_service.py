import secrets
from app.models.event_model import EventJoinLink
from app.extensions import db

# Create a new join link for event
def create_join_link(event_id, expires_in_hours=24):
    token = secrets.token_urlsafe(32)
    # expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    link = EventJoinLink(event_id=event_id, token=token)
    db.session.add(link)
    db.session.commit()
    return link
