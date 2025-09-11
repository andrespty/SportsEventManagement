from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class UserRole(str, Enum):
    USER = "user"
    MANAGER = "manager"
    ADMIN = "admin"

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default=UserRole.USER, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    isOwner = db.Column(db.Boolean, default=False, nullable=False)

    clubs = db.relationship("Club", back_populates="owner")

    def set_password(self, password: str):
        """Hash and store a password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Check if a password matches the stored hash."""
        return check_password_hash(self.password_hash, password)

class Club(db.Model):
    __tablename__ = "clubs"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)

    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    owner = db.relationship("User", back_populates="clubs")