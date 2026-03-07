```markdown
# Payment Processor System

Welcome to the Payment Processor System, a comprehensive, enterprise-grade, full-stack solution for handling payment transactions. This project is built with a focus on scalability, security, and maintainability, leveraging modern technologies like FastAPI (Python), PostgreSQL, and React (conceptual frontend).

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Local Development with Docker](#local-development-with-docker)
  - [Backend Setup (without Docker)](#backend-setup-without-docker)
  - [Frontend Setup (Conceptual)](#frontend-setup-conceptual)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

This system provides a robust set of features essential for a payment processor:

*   **User & Merchant Management:**
    *   Secure user registration and authentication (JWT).
    *   Role-based access control (Admin, Merchant).
    *   Merchant onboarding with unique API keys.
*   **Customer & Payment Method Management:**
    *   Creation and management of customer profiles (linked to merchants).
    *   Secure storage of tokenized payment methods (e.g., credit cards via a mock gateway).
*   **Transaction Processing:**
    *   Initiate, authorize, capture, refund, and cancel payments.
    *   Support for various transaction statuses.
    *   Idempotency handling for reliable transactions.
    *   Integration with a mock external payment gateway.
*   **Webhooks:**
    *   System for dispatching transaction events to merchants (e.g., `transaction.succeeded`).
    *   Retry mechanism for failed webhook deliveries.
*   **Security:**
    *   Password hashing (Bcrypt).
    *   JWT-based authentication.
    *   Data validation with Pydantic.
    *   Prevention of storing sensitive card data directly.
*   **Observability:**
    *   Comprehensive logging.
    *   Audit trails for critical actions.
*   **Performance & Scalability:**
    *   Asynchronous backend with FastAPI.
    *   Caching with Redis for improved response times and session management.
    *   Rate limiting to protect against abuse.
*   **Developer Experience:**
    *   Dockerized environment for easy setup.
    *   Alembic for database migrations.
    *   Pre-commit hooks for code quality.
    *   Extensive API documentation (Swagger UI).

## Architecture

(See `ARCHITECTURE.md` for a detailed breakdown)

This project follows a layered architectural pattern, separating concerns into:

*   **Presentation Layer (Frontend):** React/Next.js for user interfaces.
*   **API Layer (Backend - FastAPI):** Handles HTTP requests, authentication, data validation, and delegates to services.
*   **Service Layer:** Contains core business logic, orchestrates interactions between models, and communicates with external services.
*   **Data Access Layer (SQLAlchemy):** Manages interactions with the PostgreSQL database.
*   **Infrastructure Layer:** Docker, Redis, external payment gateway mock, logging, caching.

## Technology Stack

**Backend:**
*   **Python 3.11+**
*   **FastAPI:** High-performance web framework.
*   **Pydantic:** Data validation and settings management.
*   **SQLAlchemy 2.0:** Asynchronous ORM for database interactions.
*   **PostgreSQL:** Robust relational database.
*   **Alembic:** Database migration tool.
*   **python-jose:** JWT implementation.
*   **passlib:** Password hashing.
*   **redis-py (asyncio):** Redis client for caching and rate limiting.
*   **Uvicorn / Gunicorn:** ASGI server.

**Frontend (Conceptual - React):**
*   **React:** JavaScript library for building user interfaces.
*   **TypeScript:** (Optional, but recommended) For type safety.
*   **Vite/Next.js:** Build tools/frameworks.
*   **Tailwind CSS:** For styling.
*   **Axios/fetch:** For API communication.

**Infrastructure:**
*   **Docker / Docker Compose:** Containerization for local development and deployment.
*   **Redis:** In-memory data store for caching and rate limiting.
*   **GitHub Actions:** CI/CD pipeline.
*   **Pre-commit:** Git hooks for code quality.

## Setup and Installation

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**
*   **Docker Desktop** (recommended for simplified setup)
*   **Python 3.11+** (if not using Docker for backend development)
*   **pip** (Python package installer)

### Local Development with Docker (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/payment-processor.git
    cd payment-processor
    ```

2.  **Create `.env` file:**
    Copy the example environment file and fill in your details. Generate a strong `SECRET_KEY`.
    ```bash
    cp .env.example .env
    # Open .env and modify DATABASE_URL, SECRET_KEY, etc.
    ```
    *   `DATABASE_URL`: Ensure this points to the `db` service as defined in `docker-compose.yml` (e.g., `postgresql+psycopg2://user:password@db:5432/payment_processor`).
    *   `SECRET_KEY`: Use `openssl rand -hex 32` to generate a secure key.

3.  **Build and run Docker services:**
    This will build the `app` image, and start `db` (PostgreSQL) and `redis` services.
    ```bash
    make docker-up
    ```
    (You might need `make docker-build` first if `docker-up` fails to find the image for `app` service)

4.  **Install Python dependencies and setup pre-commit hooks (outside container for local dev):**
    ```bash
    make install
    ```

5.  **Apply database migrations:**
    ```bash
    make migrate-head
    ```
    This will create all necessary tables in your PostgreSQL database.

6.  **Start the FastAPI application:**
    ```bash
    make run
    ```
    The API should now be running at `http://localhost:8000`.

### Backend Setup (without Docker)

If you prefer to run the backend directly on your machine (requires local PostgreSQL and Redis installations):

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/payment-processor.git
    cd payment-processor
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up PostgreSQL and Redis:**
    *   Ensure you have PostgreSQL and Redis servers running locally.
    *   Create a database (e.g., `payment_processor`) and a user in PostgreSQL.
    *   Make sure your Redis server is running on the default port (6379).

5.  **Create `.env` file:**
    Copy `.env.example` to `.env` and update `DATABASE_URL` to point to your local PostgreSQL instance (e.g., `postgresql+psycopg2://<your_user>:<your_password>@localhost:5432/payment_processor`). Update `SECRET_KEY` and other settings.

6.  **Apply database migrations:**
    ```bash
    alembic upgrade head
    ```

7.  **Run the application:**
    ```bash
    uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload
    ```

### Frontend Setup (Conceptual)

The `frontend/` directory provides a placeholder for a React application.
To set it up (conceptually):

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install # or yarn install
    ```
3.  **Start the development server:**
    ```bash
    npm start # or yarn start
    ```
    This will typically open the frontend in your browser at `http://localhost:3000` (or similar).

## Running the Application

Once set up, use `make run` to start the backend.
Access the API at `http://localhost:8000`.

## Database Migrations

This project uses Alembic for database migrations.

*   **Create a new migration script:**
    ```bash
    make migrate-create MESSAGE="descriptive_name_of_migration"
    ```
    This will generate a new migration file in `alembic/versions/`. Review and edit it if necessary.

*   **Apply pending migrations:**
    ```bash
    make migrate-head
    ```

## Testing

The project includes unit, integration, and API tests using `pytest`.

*   **Run all tests:**
    ```bash
    make tests
    ```
*   **Run unit tests:**
    ```bash
    make test-unit
    ```
*   **Run integration tests:**
    ```bash
    make test-integration
    ```
*   **Run API tests:**
    ```bash
    make test-api
    ```

To generate a coverage report:
```bash
pytest --cov=app --cov-report=term-missing --cov-report=html
```

## Code Quality

Pre-commit hooks are configured to ensure code quality (formatting with Black, sorting imports with iSort, linting with Flake8).

*   **Install hooks (done by `make install`):**
    ```bash
    pre-commit install
    ```
*   **Manually run all checks:**
    ```bash
    make lint
    ```
*   **Auto-format code:**
    ```bash
    make format
    ```

## API Documentation

FastAPI automatically generates interactive API documentation.

*   **Swagger UI:** Accessible at `http://localhost:8000/docs`
*   **ReDoc:** Accessible at `http://localhost:8000/redoc`

(See `API_DOCS.md` for a more structured overview of endpoints and models).

## Deployment

(See `DEPLOYMENT.md` for detailed deployment instructions)

The `Dockerfile` and `docker-compose.yml` provide a solid base for containerized deployment.
A sample GitHub Actions workflow (`.github/workflows/ci-cd.yml`) demonstrates a CI/CD pipeline for building, testing, and deploying the application.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Run tests and ensure they pass (`make tests`).
5.  Ensure code quality (`make lint`).
6.  Commit your changes (`git commit -m 'feat: Add new feature X'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Create a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```