from app.extensions import db
from datetime import datetime
from sqlalchemy.ext.associationproxy import association_proxy

event_clubs = db.Table(
    "event_clubs",
    db.Column("event_id", db.Integer, db.ForeignKey("events.id"), primary_key=True),
    db.Column("club_id", db.Integer, db.ForeignKey("clubs.id"), primary_key=True)
)

class ParticipantCategory(db.Model):
    __tablename__ = "participant_categories"
    participant_id = db.Column(db.Integer, db.ForeignKey("event_participants.id", ondelete='CASCADE'), primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete='CASCADE'), primary_key=True)
    seed = db.Column(db.Integer, nullable=True)  # <--- new seed column

    participant = db.relationship("EventParticipant", back_populates="participant_categories")
    category = db.relationship("Category", back_populates="participant_categories")


class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)

    organizer_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)
    organizer = db.relationship("Club", backref="organized_events")

    participating_clubs = db.relationship(
        "Club",
        secondary=event_clubs,
        backref="events_participating"
    )

    categories = db.relationship("Category", back_populates="event")
    participants = db.relationship("EventParticipant", back_populates="event")


class EventParticipant(db.Model):
    __tablename__ = "event_participants"
    id = db.Column(db.Integer, primary_key=True)

    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)

    name = db.Column(db.String(120), nullable=False)  # participant name
    points = db.Column(db.Integer, default=0)  # accumulated from matches

    event = db.relationship("Event", back_populates="participants")
    club = db.relationship("Club", backref="participants")

    participant_categories = db.relationship(
        "ParticipantCategory",
        back_populates="participant",
        cascade="all, delete-orphan"
    )
    # Convenience property to access categories directly
    categories = association_proxy("participant_categories", "category")

class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.Integer, primary_key=True)
    order = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120), nullable=False)  # e.g., "Under 12 - Blue Belt"
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    can_sign_up = db.Column(db.Boolean, default=True, nullable=False) # can become an array of matches or bracket
    is_bracket = db.Column(db.Boolean, default=True, nullable=False) #if can_sign_up is false, it is a bracket
    # JSON field for rules & scoring system
    ruleset = db.Column(db.JSON, nullable=True, default={})

    event = db.relationship("Event", back_populates="categories")
    matches = db.relationship("Match", back_populates="category")

    participant_categories = db.relationship(
        "ParticipantCategory",
        back_populates="category",
        cascade="all, delete-orphan"
    )
    participants = association_proxy("participant_categories", "participant")


class Match(db.Model):
    __tablename__ = "matches"
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)

    round = db.Column(db.Integer, nullable=True)  # useful for brackets
    match_number = db.Column(db.Integer, nullable=True)  # order inside round
    start_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default="scheduled")  # scheduled, ongoing, finished

    category = db.relationship("Category", back_populates="matches")
    participants = db.relationship("MatchParticipant", back_populates="match", cascade="all, delete-orphan")


class MatchParticipant(db.Model):
    __tablename__ = "match_participants"
    id = db.Column(db.Integer, primary_key=True)
    
    match_id = db.Column(db.Integer, db.ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    participant_id = db.Column(db.Integer, db.ForeignKey("event_participants.id", ondelete="CASCADE"), nullable=False)
    
    role = db.Column(db.String(20), default="competitor")  # competitor, referee, etc.
    position = db.Column(db.String(20), nullable=True)  # e.g. lane number in swimming, bracket position
    score = db.Column(db.Float, nullable=True)  # general score, time, or points
    rank = db.Column(db.Integer, nullable=True)  # 1st, 2nd, etc.
    result_type = db.Column(db.String(20), nullable=True)  # win, loss, draw, dq, etc.

    participant = db.relationship("EventParticipant", backref="matches")
    match = db.relationship("Match", back_populates="participants")

class MatchRelation(db.Model):
    __tablename__ = "match_relations"
    id = db.Column(db.Integer, primary_key=True)
    
    source_match_id = db.Column(db.Integer, db.ForeignKey("matches.id", ondelete="CASCADE"))
    target_match_id = db.Column(db.Integer, db.ForeignKey("matches.id", ondelete="CASCADE"))
    qualifier_rank = db.Column(db.Integer, default=1)  # winner(1) or runner-up(2) advances
    
    source_match = db.relationship("Match", foreign_keys=[source_match_id], backref="next_match_links")
    target_match = db.relationship("Match", foreign_keys=[target_match_id], backref="previous_match_links")


class EventJoinRequest(db.Model):
    __tablename__ = "event_join_requests"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    event = db.relationship("Event", backref=db.backref("join_requests", lazy=True))
    club = db.relationship("Club", backref=db.backref("join_requests", lazy=True))


class EventJoinLink(db.Model):
    __tablename__ = "event_join_links"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)  # optional expiry

    event = db.relationship("Event", backref="join_links")

