# Sports Event Management System

A full-stack web application for managing sports clubs and events, built with React and Flask.

## Features

- User authentication and authorization
- Club management (create, join, manage members)
- Event creation and management 
- Match scheduling and bracket generation
- User roles (admin, manager, user)

## Tech Stack

### Frontend
- React with TypeScript
- Chakra UI for components
- React Router for navigation 
- Axios for API calls

### Backend
- Flask
- SQLAlchemy for ORM
- Flask-JWT-Extended for authentication
- Flask-Migrate for database migrations
- SQLite database

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- pip
- npm or yarn

### Installation & Setup

1. Clone the repository
```sh
git clone <repository-url>
cd sports_event_management
```

2. Backend Setup
```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

# Initialize the database
flask db upgrade

# Start the Flask server
python run.py
```

3. Frontend Setup
```sh
cd frontend
npm install
# or
yarn install

# Create .env.development file with:
REACT_APP_API_URL=http://127.0.0.1:5000

# Start the development server
npm start
# or
yarn start
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://127.0.0.1:5000`.

## Development

- Frontend development server includes hot-reloading
- Backend uses Flask development server with debug mode
- SQLite database file is created at `backend/app/dev.db`

## Production Deployment

1. Update `frontend/.env.production` with your production API URL
2. Build the frontend:
```sh
cd frontend
npm run build
```
3. Configure your production database in `backend/app/config.py`
4. Deploy the backend with a production WSGI server like Gunicorn

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
