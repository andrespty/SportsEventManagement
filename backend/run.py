from app import create_app
from app.extensions import db
# Create the Flask application
app = create_app('development') # production | testing

with app.app_context():
    print(db.metadata.tables.keys())

if __name__ == "__main__":
    # Run in debug mode for development
    app.run(debug=True)
