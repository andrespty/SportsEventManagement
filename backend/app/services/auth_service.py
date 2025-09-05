# app/services/auth_service.py
from app.models.user_model import User
from app.extensions import db
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
from app.schemas.user_schema import users_schema

def register_user(email: str, password: str, role: str = "user"):
    # Check if email or username exists
    if User.query.filter_by(email=email).first():
        return {"message": "Email already registered"}, 400

    # Create user
    hashed_password = generate_password_hash(password)
    user = User(email=email, password_hash=hashed_password, role=role)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return {"access_token": access_token, "user": user}, 201

def login_user(email: str, password: str):
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return {"message": "Invalid email or password"}, 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return {"access_token": access_token, "user": user, "refresh_token": refresh_token}, 200

def get_all_users_by_manager():
    users = User.query.all()
    return users