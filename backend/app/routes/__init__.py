from .auth_routes import auth_bp
from .club_routes import club_bp
from .event import event_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(club_bp)
    app.register_blueprint(event_bp)