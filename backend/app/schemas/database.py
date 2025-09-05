# from flask_sqlalchemy import SQLAlchemy
# from datetime import datetime
# import os
# from dotenv import load_dotenv

# load_dotenv()

# db = SQLAlchemy()

# def init_db(app):
#     # Database configuration
#     app.config['SQLALCHEMY_DATABASE_URI'] = (
#         f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:"
#         f"{os.getenv('DB_PASSWORD', 'password')}@"
#         f"{os.getenv('DB_HOST', 'localhost')}/"
#         f"{os.getenv('DB_NAME', 'event_manager')}"
#     )
#     app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
#     db.init_app(app)
    
#     with app.app_context():
#         db.create_all()