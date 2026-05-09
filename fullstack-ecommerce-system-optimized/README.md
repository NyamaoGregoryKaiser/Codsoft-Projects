```markdown
# E-commerce Solutions System

This is a comprehensive, production-ready e-commerce solution built with Python. It features a robust FastAPI backend for the API and a Flask frontend for server-side rendered pages that consume the API.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
  - [Using Docker (Recommended)](#using-docker-recommended)
  - [Manual Setup](#manual-setup)
- [Running Migrations](#running-migrations)
- [Seed Data](#seed-data)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Additional Features](#additional-features)
- [Contributing](#contributing)
- [License](#license)

## Features

**Core Application (FastAPI Backend & Flask Frontend):**
- **User Management**: Registration, Login (JWT-based authentication), User profiles.
- **Product Catalog**: View products, filter by category, search by name/description.
- **Category Management**: Create, view, update, delete product categories (admin only).
- **Shopping Cart**: Add/remove items, update quantities, clear cart.
- **Order Management**: Place orders from cart, view past orders.
- **Product Reviews**: Submit and view product reviews.

**Database Layer:**
- PostgreSQL for robust data storage.
- SQLAlchemy ORM for Pythonic database interactions.
- Alembic for database schema migrations.
- Seed data for initial setup.

**Configuration & Setup:**
- `requirements.txt` for all Python dependencies.
- `.env` files for environment-specific configurations.
- Docker and Docker Compose for containerized development and deployment.
- CI/CD pipeline configuration (GitHub Actions example).

**Testing & Quality:**
- Unit tests for core logic (e.g., security, CRUD operations).
- Integration tests for API endpoints.
- Basic setup for performance testing (conceptual).

**Additional Features:**
- **Authentication/Authorization**: JWT tokens, role-based access control (superuser/normal user).
- **Logging & Monitoring**: Structured logging with `logging` module.
- **Error Handling**: Custom exception middleware in FastAPI.
- **Caching Layer**: Redis with `FastAPI-Cache` for API responses.
- **Rate Limiting**: `FastAPI-Limiter` to protect endpoints from abuse.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for a high-level overview.

## Project Structure

```
ecommerce-system/
├── backend/                  # FastAPI Backend application
│   ├── app/
│   │   ├── api/              # API endpoints (v1)
│   │   ├── core/             # Core utilities (config, security, deps, cache, logging, exceptions)
│   │   ├── crud/             # CRUD operations for database models
│   │   ├── db/               # Database setup (models, session, migrations, seed)
│   │   ├── middleware/       # Custom middleware (e.g., rate limiting)
│   │   ├── schemas/          # Pydantic models for request/response validation
│   │   ├── main.py           # FastAPI application entry point
│   │   └── tests/            # Unit and Integration tests
│   ├── .env.example          # Example environment variables
│   ├── Dockerfile            # Dockerfile for backend service
│   ├── alembic.ini           # Alembic configuration for DB migrations
│   ├── requirements.txt      # Python dependencies for backend
│   └── start.sh              # Entrypoint script for Docker (migrations + run app)
├── frontend/                 # Flask Frontend application
│   ├── app.py                # Flask application entry point
│   ├── static/               # Static files (CSS, JS)
│   ├── templates/            # Jinja2 HTML templates
│   ├── .env.example          # Example environment variables
│   └── requirements.txt      # Python dependencies for frontend
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml        # Docker Compose file for local development
├── ARCHITECTURE.md           # Architecture documentation
└── README.md                 # Project README (this file)
```

## Prerequisites

- Git
- Docker and Docker Compose (recommended)
- Python 3.11+ and pip (for manual setup)

## Local Development Setup

### Using Docker (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecommerce-system.git
    cd ecommerce-system
    ```

2.  **Create `.env` files:**
    Copy the example environment files and fill in your secrets.
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    **Important**: Replace `"YOUR_SUPER_SECRET_KEY_HERE"` and `"ANOTHER_SUPER_SECRET_KEY"` with strong, randomly generated keys in `backend/.env` and `frontend/.env` respectively. You might also want to change the default superuser credentials and Redis password.

3.  **Build and run the Docker containers:**
    ```bash
    docker-compose up --build
    ```
    This will:
    - Build Docker images for `backend` and `frontend`.
    - Start PostgreSQL (`db`), Redis (`redis`), FastAPI backend (`backend`), and Flask frontend (`frontend`) services.
    - Run Alembic migrations on the `backend` service (via `start.sh`).
    - Initialize seed data in the database (via `start.sh`).

4.  **Access the applications:**
    - **FastAPI Backend (API Docs)**: `http://localhost:8000/api/v1/docs`
    - **Flask Frontend**: `http://localhost:8001`

### Manual Setup

This method requires a local PostgreSQL database and Redis instance running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ecommerce-system.git
    cd ecommerce-system
    ```

2.  **Set up PostgreSQL and Redis:**
    - Install and start PostgreSQL. Create a database (e.g., `ecommerce_db`) and a user with access.
    - Install and start Redis.

3.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env
    # Edit .env to point to your local PostgreSQL and Redis instances (e.g., POSTGRES_SERVER=localhost)
    alembic upgrade head # Run database migrations
    python -c "from app.db.session import SessionLocal; from app.db.init_db import init_db; db = SessionLocal(); init_db(db); db.close()" # Seed data
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

4.  **Frontend Setup:**
    In a new terminal:
    ```bash
    cd frontend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env
    # Ensure FASTAPI_BASE_URL in frontend/.env points to your FastAPI backend (e.g., http://localhost:8000/api/v1)
    flask run --host=0.0.0.0 --port=8001
    ```

## Running Migrations

Database migrations are managed using Alembic.

-   **Generate a new migration:**
    ```bash
    # From the backend directory
    alembic revision --autogenerate -m "Description of your changes"
    ```
-   **Apply migrations:**
    ```bash
    # From the backend directory
    alembic upgrade head
    ```
-   **Downgrade migrations:**
    ```bash
    # From the backend directory
    alembic downgrade -1 # Downgrade by one revision
    ```
    (Use with caution in production!)

## Seed Data

The `backend/start.sh` script (used by Docker Compose) automatically runs `app/db/init_db.py` to:
- Create a superuser (admin@example.com / adminpassword, configurable via `.env`).
- Add sample categories.
- Add sample products linked to the superuser and categories.

If running manually, execute the seed script after migrations:
```bash
# From the backend directory
python -c "from app.db.session import SessionLocal; from app.db.init_db import init_db; db = SessionLocal(); init_db(db); db.close()"
```

## Running Tests

Tests are located in `backend/app/tests/`.
-   **Unit Tests**: Test individual components.
-   **Integration Tests**: Test interactions between components, especially API endpoints.

To run tests (from the `backend` directory, after setting up a test database as specified in `conftest.py` and `.env`):

```bash
# Ensure your .env for backend is configured for the test database
pytest app/tests/ --cov=app --cov-report=term-missing
```
The `docker-compose.yml` also sets up `db` and `redis` services for the `backend-tests` job in `ci.yml`.

## API Documentation

The FastAPI backend automatically generates interactive API documentation:
-   **Swagger UI**: `http://localhost:8000/api/v1/docs`
-   **ReDoc**: `http://localhost:8000/api/v1/redoc`

These interfaces allow you to explore the available endpoints, data schemas, and even make requests directly from your browser.

## Deployment

The `docker-compose.yml` provides a basic production-ready setup for local development. For production deployment, you would typically:

1.  **Optimized Docker Images**: Build images without development volumes (e.g., `docker-compose -f docker-compose.yml build --no-cache`).
2.  **Environment Variables**: Ensure all sensitive environment variables are securely managed (e.g., Kubernetes Secrets, AWS Secrets Manager).
3.  **Reverse Proxy**: Use Nginx or Caddy as a reverse proxy for SSL termination, load balancing, and serving static files.
4.  **Container Orchestration**: Deploy on platforms like Kubernetes, Docker Swarm, or cloud services (AWS ECS, Google Cloud Run, Azure Container Apps) for scalability, high availability, and easier management.
5.  **Database Management**: Use a managed PostgreSQL service (e.g., AWS RDS, Azure Database for PostgreSQL).
6.  **Monitoring**: Integrate with monitoring tools (Prometheus, Grafana, Sentry) for application health and performance.

## CI/CD

A basic GitHub Actions workflow (`.github/workflows/ci.yml`) is provided. This pipeline currently:
- Checks out the code.
- Sets up Python environments for both backend and frontend.
- Installs dependencies.
- Runs backend database migrations against a test database.
- Executes backend unit and integration tests with coverage.
- Uploads test results and coverage reports.
- Includes a placeholder for frontend checks.

For a full CI/CD pipeline, you would extend this to include:
- Linting and static analysis (e.g., Black, Flake8, Pylint).
- Building Docker images.
- Pushing images to a container registry (e.g., Docker Hub, AWS ECR).
- Deployment to a staging or production environment.

## Additional Features

-   **Authentication/Authorization**: Implemented using JWT tokens with `python-jose` and password hashing with `passlib`. Dependencies ensure secure access control.
-   **Logging & Monitoring**: Configured with Python's standard `logging` module. All significant events (user actions, errors, API requests) are logged to console and a file (`backend/logs/ecommerce_backend.log`).
-   **Error Handling Middleware**: A custom `CustomException` and global exception handler in `backend/app/main.py` provide consistent API error responses.
-   **Caching Layer**: Redis is integrated with `FastAPI-Cache` decorator (`@cached`) for API response caching on product and category retrieval to improve performance and reduce database load.
-   **Rate Limiting**: `FastAPI-Limiter` is integrated with Redis to prevent abuse of certain API endpoints (e.g., user registration).

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass and code coverage is maintained.
6.  Commit your changes (`git commit -m 'Add new feature'`).
7.  Push to the branch (`git push origin feature/your-feature`).
8.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details (not provided here, but would typically be present).

```

#### API Documentation
As mentioned, FastAPI automatically generates interactive API documentation (Swagger UI and ReDoc). The structure and docstrings in the endpoint files will be reflected there.

#### Architecture Documentation