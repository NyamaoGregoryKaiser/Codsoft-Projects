```markdown
# ML Utilities System

A comprehensive, production-ready Machine Learning Utilities System with a full-stack web application, designed to manage datasets, train simple ML models, track experiments, and serve predictions.

## Features

**Core Application (Backend - Python/FastAPI, Frontend - React/TailwindCSS)**
*   **User Management:**
    *   User registration and login.
    *   Role-based access control (normal user, superuser/admin).
    *   User profile viewing.
*   **Dataset Management:**
    *   Upload CSV files.
    *   View dataset details (column info, row count).
    *   Preview dataset content.
    *   Update and delete datasets.
    *   Datasets are user-specific.
*   **Model Management:**
    *   Train simple classification (Logistic Regression, RandomForestClassifier) and regression (Linear Regression, RandomForestRegressor) models on uploaded datasets.
    *   Specify target and feature columns.
    *   View trained model details.
    *   Update and delete models.
    *   Models are user-specific.
*   **Experiment Tracking:**
    *   Automatically logs model training experiments, including hyperparameters and evaluation metrics.
    *   View a list of experiments.
    *   View detailed experiment results.
    *   Delete experiments (cascades from model deletion).
*   **Prediction Service:**
    *   API endpoint to request predictions from a trained and deployed model.
    *   Input JSON data for inference.

**Database Layer (PostgreSQL with SQLAlchemy/Alembic)**
*   Schema definitions for Users, Datasets, Models, and Experiments.
*   Alembic for database migrations.
*   `seed_data.py` for initial superuser and regular user creation.
*   Query optimization examples (e.g., `selectinload` for eager loading).

**Configuration & Setup**
*   `requirements.txt` and `package.json` for all dependencies.
*   Environment configuration via `.env` files.
*   Docker and Docker Compose for containerization of all services (PostgreSQL, Redis, FastAPI, React).
*   GitHub Actions configuration for CI/CD (linting, testing, Docker build/push).

**Testing & Quality**
*   **Backend:**
    *   Unit tests for CRUD operations, authentication logic, ML services (Pytest, pytest-asyncio, pytest-cov).
    *   Integration/API tests for FastAPI endpoints.
    *   Aims for high code coverage (example tests provided).
*   **Frontend:**
    *   Conceptual outline for Unit and Integration tests using Jest/React Testing Library.
*   **Performance Tests:**
    *   Locust script for API load testing.

**Additional Features**
*   **Authentication/Authorization:** JWT-based authentication, `OAuth2PasswordBearer`, role-based authorization for endpoints (e.g., admin-only routes).
*   **Logging & Monitoring:** Structured logging using Python's `logging` module, configured for console and file output.
*   **Error Handling Middleware:** Centralized FastAPI exception handling for custom exceptions and validation errors.
*   **Caching Layer:** Redis integration for caching model artifacts and potentially other frequently accessed data.
*   **Rate Limiting:** `fastapi-limiter` integration for API rate limiting.

## Project Structure

```
ml-utilities-system/
├── .github/                       # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline configuration
├── backend/                       # FastAPI application (Python)
│   ├── app/                       # Core application logic
│   │   ├── api/                   # API routers and endpoints
│   │   ├── auth/                  # Authentication & authorization logic
│   │   ├── core/                  # Configuration, exceptions, logging
│   │   ├── crud/                  # Database interaction (CRUD operations)
│   │   ├── db/                    # Database session, models, migrations setup
│   │   ├── middleware/            # Error handling, rate limiting middleware
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic schemas for data validation
│   │   ├── services/              # Business logic (ML, dataset processing, prediction)
│   │   ├── utils/                 # Helper utilities (storage, caching)
│   │   └── main.py                # FastAPI app entry point
│   ├── migrations/                # Alembic migration scripts
│   ├── tests/                     # Backend unit, integration, API tests
│   ├── Dockerfile                 # Dockerfile for backend service
│   ├── alembic.ini                # Alembic configuration
│   ├── entrypoint.sh              # Docker entrypoint script for migrations/startup
│   ├── gunicorn_conf.py           # Gunicorn configuration for production
│   ├── requirements.txt           # Python dependencies
│   ├── seed_data.py               # Script to seed initial database data
│   └── .env.example               # Example environment variables
├── frontend/                      # React application
│   ├── public/                    # Public assets
│   ├── src/                       # React source code
│   │   ├── api/                   # API client (Axios)
│   │   ├── assets/                # Static assets
│   │   ├── components/            # Reusable UI components
│   │   ├── context/               # React Context for global state (e.g., Auth)
│   │   ├── pages/                 # Main application pages
│   │   ├── App.js                 # Main React application component
│   │   └── index.js               # React entry point
│   ├── Dockerfile                 # Dockerfile for frontend service
│   ├── package.json               # Node.js dependencies and scripts
│   ├── postcss.config.js          # PostCSS configuration for TailwindCSS
│   ├── tailwind.config.js         # TailwindCSS configuration
│   └── .env.example               # Example environment variables
├── docker-compose.yml             # Docker Compose for multi-service setup
├── docs/                          # Project documentation
│   ├── api.md                     # API documentation
│   ├── architecture.md            # Architecture overview
│   └── deployment.md              # Deployment guide
└── tests/                         # Root level tests (e.g., performance)
    └── performance/
        └── locustfile.py          # Locust performance test script
```

## Setup Instructions

### Prerequisites

*   Docker and Docker Compose
*   Python 3.9+ (for local development/testing outside Docker)
*   Node.js 18+ and npm (for local frontend development/testing outside Docker)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ml-utilities-system.git
cd ml-utilities-system
```

### 2. Configure Environment Variables

Create `.env` files based on the `.env.example` files in both `backend/` and `frontend/` directories.

**`backend/.env`:**
```
DATABASE_URL="postgresql+psycopg2://user:password@db:5432/ml_utilities_db"
SECRET_KEY="YOUR_SUPER_SECRET_KEY_HERE_CHANGE_THIS_IN_PROD" # IMPORTANT: Use a strong, random key
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL="redis://redis:6379/0"
DATA_STORAGE_PATH="/app/data/storage" # This path is inside the Docker container
BACKEND_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1" # Frontend URL, add others if needed
FIRST_SUPERUSER_EMAIL="admin@example.com"
FIRST_SUPERUSER_PASSWORD="adminpassword"
FIRST_SUPERUSER_USERNAME="admin"
```

**`frontend/.env`:**
```
REACT_APP_API_BASE_URL="http://localhost:8000/api/v1"
```

### 3. Build and Run with Docker Compose

This is the recommended way to run the entire system.

```bash
docker compose build
docker compose up -d
```

*   `docker compose build`: Builds the Docker images for backend and frontend.
*   `docker compose up -d`: Starts all services in detached mode (`-d`). This will:
    *   Start PostgreSQL and Redis.
    *   Run backend's `entrypoint.sh` to wait for DB, run Alembic migrations, and seed initial data.
    *   Start the FastAPI backend with Gunicorn.
    *   Start the React development server.

**Initial Superuser:** The `seed_data.py` script (run by `entrypoint.sh`) will create an initial superuser with the credentials specified in `backend/.env`. By default:
*   **Email:** `admin@example.com`
*   **Password:** `adminpassword`
*   **Username:** `admin`

### 4. Access the Application

*   **Frontend (React App):** Open your browser to `http://localhost:3000`
*   **Backend API (FastAPI Docs):** Open your browser to `http://localhost:8000/docs` (Swagger UI) or `http://localhost:8000/redoc`

### Stopping Services

```bash
docker compose down
```

This will stop and remove the containers, networks, and volumes (except named volumes for data persistence).

## Local Development (Without Docker Compose)

If you prefer to run services locally outside Docker (e.g., for easier debugging), you would:

1.  **Start PostgreSQL and Redis separately.** (e.g., using `docker compose up db redis` or native installations).
2.  **Backend (Python/FastAPI):**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    # Set environment variables (e.g., source .env)
    # Run migrations:
    alembic upgrade head
    # Seed data (if needed):
    python seed_data.py
    # Run the app (for development):
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
3.  **Frontend (React):**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

## Testing

### Backend Tests

Run from the `backend/` directory:

```bash
cd backend
pytest --cov=app --cov-report=term-missing tests/
# For HTML coverage report:
pytest --cov=app --cov-report=html tests/
```

### Frontend Tests (Jest/React Testing Library)

Run from the `frontend/` directory:

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Performance Tests (Locust)

Ensure all Docker Compose services are running.

1.  Start Locust from the `tests/performance` directory:
    ```bash
    cd tests/performance
    locust -f locustfile.py
    ```
2.  Open your browser to `http://localhost:8089` (Locust UI).
3.  Enter the host for your FastAPI backend (`http://localhost:8000`) and configure the number of users/spawn rate. Start the test.

---

## Documentation

### API Documentation

The backend API is documented using FastAPI's automatic OpenAPI generation.
*   **Swagger UI:** `http://localhost:8000/docs`
*   **ReDoc:** `http://localhost:8000/redoc`

A supplementary `docs/api.md` provides a higher-level overview.