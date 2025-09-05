from flask import Flask
from .extensions import db, migrate, ma, jwt
from .routes import register_blueprints
from .config import config_by_name
from dotenv import load_dotenv
from flask_cors import CORS
import os

def create_app(config_name="development"):
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    CORS(
        app, 
        origins=['http://localhost:3000'], 
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)

    from app.models.user_model import User, Club
    from app.models.event_model import Event, EventParticipant, Category, Match
                 
    with app.app_context():
        db.create_all()
    
    # Register routes
    register_blueprints(app)

    return app