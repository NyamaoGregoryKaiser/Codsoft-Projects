# Enterprise-Grade Web Scraping Tools System

This project is a comprehensive, production-ready web scraping tools system designed for enterprise use. It allows users to define scrapers, run scraping jobs, view results, and manage their scraping operations through a robust API and a user-friendly web interface.

## Features

*   **Backend (FastAPI)**:
    *   RESTful API with full CRUD operations for Scrapers, Jobs, Results, and Users.
    *   JWT-based Authentication and Role-based Authorization.
    *   Asynchronous scraping task execution using Celery and Redis.
    *   PostgreSQL database with SQLAlchemy ORM and Alembic migrations.
    *   Structured logging, custom error handling, API rate limiting, and caching.
    *   Secure password hashing (Bcrypt).
*   **Frontend (React)**:
    *   Intuitive UI for managing scrapers, triggering jobs, and viewing results.
    *   User authentication flow.
    *   (Conceptual with key components provided to demonstrate integration)
*   **Infrastructure**:
    *   Docker and Docker Compose for easy setup and deployment.
    *   Environment-based configuration.
*   **Quality & Testing**:
    *   Extensive test suite: unit, integration, and API tests using `pytest`.
    *   Performance testing with `Locust`.
    *   CI/CD pipeline (GitHub Actions).
*   **Documentation**:
    *   Comprehensive README.md.
    *   Auto-generated OpenAPI (Swagger UI) for API.
    *   Architecture and Deployment guides.

## Technologies Used

*   **Backend**: Python 3.9+, FastAPI, SQLAlchemy, Alembic, Pydantic, httpx, BeautifulSoup4, Celery, Redis, Psycopg2, Passlib, python-jose, python-dotenv, Uvicorn, Gunicorn.
*   **Frontend**: React, TypeScript, React Router, Axios, TailwindCSS.
*   **Database**: PostgreSQL.
*   **Containerization**: Docker, Docker Compose.
*   **Testing**: Pytest, Locust.
*   **CI/CD**: GitHub Actions.

## Setup and Running Locally

### Prerequisites

*   Docker and Docker Compose
*   Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/web-scraping-system.git
cd web-scraping-system
```

### 2. Configure Environment Variables

Create `.env` files based on the provided `.env.example` files.

#### `backend/.env`

```ini
# Core Application Settings
APP_NAME="WebScrapingSystem"
ENVIRONMENT="development"
DEBUG="True"
SECRET_KEY="YOUR_SUPER_SECRET_JWT_KEY_HERE_MIN_32_CHARS" # IMPORTANT: Generate a strong random key!
ACCESS_TOKEN_EXPIRE_MINUTES="60"

# Database Settings
POSTGRES_USER="user"
POSTGRES_PASSWORD="password"
POSTGRES_DB="scraper_db"
POSTGRES_HOST="db"
POSTGRES_PORT="5432"
DATABASE_URL="postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

# Redis Settings (for Celery, Cache, Rate Limiting)
REDIS_HOST="redis"
REDIS_PORT="6379"
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}/0"
CELERY_BROKER_URL="redis://${REDIS_HOST}:${REDIS_PORT}/1"
CELERY_RESULT_BACKEND="redis://${REDIS_HOST}:${REDIS_PORT}/2"

# Admin User Seed Data (for initial setup)
FIRST_SUPERUSER_EMAIL="admin@example.com"
FIRST_SUPERUSER_PASSWORD="supersecretpassword"
```

#### `frontend/.env`

```ini
VITE_API_BASE_URL="http://localhost:8000/api/v1"
```

### 3. Build and Run with Docker Compose

From the project root directory:

```bash
docker-compose up --build -d
```

This command will:
*   Build Docker images for the backend, frontend, and Celery worker.
*   Start the PostgreSQL database service.
*   Start the Redis service.
*   Start the FastAPI backend service (accessible on `http://localhost:8000`).
*   Start the Celery worker service.
*   Start the React frontend service (accessible on `http://localhost:3000`).

### 4. Apply Database Migrations and Seed Data

After the services are up, execute the migrations and seed data scripts within the backend container.

```bash
docker-compose exec backend /bin/bash -c "alembic upgrade head && python -c 'from app.crud.user import seed_initial_superuser; seed_initial_superuser()'"
```
This will create the database schema and seed an initial superuser (using the credentials from `backend/.env`).

### 5. Access the Application

*   **Frontend**: Open your browser to `http://localhost:3000`
*   **Backend API (Swagger UI)**: Open your browser to `http://localhost:8000/docs`
*   **Backend API (ReDoc)**: Open your browser to `http://localhost:8000/redoc`
*   **Flower (Celery Monitoring)**: Open your browser to `http://localhost:5555`

You can log in to the frontend or interact with the API using the `admin@example.com` and `supersecretpassword` credentials.

### Stopping the Services

To stop all services:

```bash
docker-compose down
```

To stop and remove all data (including database volumes):

```bash
docker-compose down -v
```

## Running Tests

### Backend Tests

From the project root:

```bash
docker-compose exec backend pytest
```

### Performance Tests (Locust)

Ensure all services are running (`docker-compose up -d`).
Then, in a *separate terminal*, run Locust:

```bash
locust -f locustfile.py --host http://localhost:8000
```
Open your browser to `http://localhost:8889` to access the Locust web UI.

## Project Structure

Refer to the `ARCHITECTURE.md` for a detailed breakdown of the project's design.

## Deployment

Refer to the `DEPLOYMENT.md` for instructions on deploying this application to a production environment.

## Contribution

Feel free to open issues or submit pull requests.

## License

This project is open-source and available under the MIT License.

---