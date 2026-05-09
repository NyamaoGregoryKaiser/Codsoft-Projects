# System Context

## System Boundary: Authentication System

The Authentication System is a full-stack web application that provides user management, authentication, and authorization services.

### External Systems:
- **Email Service Provider (e.g., SendGrid, Mailgun):** Used for sending transactional emails (verification, password reset).
- **Client (Web Browser):** Users interact with the system via a web browser.
- **Database (PostgreSQL):** Stores all persistent data.
- **Cache (Redis):** Stores transient data like invalidated refresh tokens and for rate limiting.

## System Components

### 1. Backend Service (Python FastAPI)

The core application logic, API endpoints, and interaction with the database and cache.

#### Components:
- **API Routers (`api/v1/*.py`):** Defines RESTful endpoints for authentication (register, login, refresh, logout, password reset, email verification), user profile management, and admin operations.
- **Authentication Service (`services/auth.py`):** Handles business logic for user registration, login, token generation/validation, password management, and email verification workflows.
- **User Service (`services/users.py`):** Manages user-specific business logic (profile updates, role assignments).
- **Database ORM (`core/database.py`, `models/*.py`, `crud/*.py`):** Uses SQLAlchemy to interact with PostgreSQL, defining data models and basic CRUD operations. Alembic for migrations.
- **Security (`core/security.py`, `dependencies/auth.py`):** Handles password hashing (Bcrypt), JWT token encoding/decoding, and authentication dependencies for FastAPI.
- **Middleware (`middleware/*.py`):**
    - **Error Handling:** Centralized exception handling.
    - **Logging:** Structured request/response logging.
    - **Rate Limiting:** Protects against abuse using Redis.
- **Utilities (`utils/*.py`):** Email sending, custom logger.
- **Configuration (`core/config.py`):** Manages application settings via Pydantic and environment variables.

#### Technologies:
- Python 3.9+
- FastAPI
- SQLAlchemy (ORM)
- Alembic (Database Migrations)
- Pydantic (Data Validation, Settings)
- PyJWT (JWT Handling)
- Passlib (Password Hashing)
- Uvicorn (ASGI Server)
- Redis (for caching/rate limiting)

### 2. Frontend Application (React)

The user interface for interacting with the backend services.

#### Components:
- **Pages (`pages/*.js`):** Top-level components for different routes (Login, Register, Dashboard, Profile, Admin).
- **Components (`components/*.js`):** Reusable UI elements (e.g., AuthForm, Header, ProtectedRoute).
- **API Client (`api/apiClient.js`):** Uses Axios to make HTTP requests to the FastAPI backend, handling token attachments and refresh logic.
- **Authentication Context (`contexts/AuthContext.js`):** Manages the global authentication state (user, tokens) and provides methods for login, logout, etc.
- **Router (`App.js`):** Uses React Router DOM for client-side navigation and protected routes.
- **Styling:** Basic CSS.

#### Technologies:
- React 18+
- React Router DOM
- Axios (HTTP Client)
- `jwt-decode` (for client-side JWT parsing)

### 3. Database (PostgreSQL)

The primary persistent storage for the system.

#### Key Tables:
- `users`: Stores user credentials, profile information, and verification status.
- `roles`: Defines different authorization roles (e.g., admin, user).
- `user_roles`: Many-to-many relationship between users and roles.
- `password_reset_tokens`: Stores tokens for password reset functionality.
- `email_verification_tokens`: Stores tokens for email verification.

#### Technologies:
- PostgreSQL

### 4. Cache (Redis)

Used for improving performance and implementing specific authentication features.

#### Use Cases:
- **Refresh Token Invalidation:** Stores blacklisted refresh tokens after logout.
- **Rate Limiting:** Tracks request counts per user/IP.

#### Technologies:
- Redis

---

# System Deployment View

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

System_Boundary(c1, "Authentication System") {
    Container(web_app, "Frontend Application", "React, Nginx", "User interface for authentication and user management.")
    Container(api_gateway, "API Gateway / Load Balancer", "Nginx, Cloud Load Balancer", "Routes requests to backend services, handles SSL termination, potentially rate limiting.")
    Container_Ext(email_service, "Email Service Provider", "SendGrid/Mailgun", "External service for sending emails (verification, password reset).")

    Container_Boundary(backend_boundary, "Backend Services") {
        Container(fastapi_app, "FastAPI Backend", "Python, Uvicorn", "Core API for authentication, user management, and authorization.")
        Container(postgres_db, "PostgreSQL Database", "SQL Database", "Stores user data, roles, tokens.")
        Container(redis_cache, "Redis Cache", "In-memory Data Store", "Used for refresh token blacklisting and rate limiting.")
    }
}

Rel(web_app, api_gateway, "Makes API calls via")
Rel(api_gateway, fastapi_app, "Routes API requests to")
Rel(fastapi_app, postgres_db, "Reads from and writes to", "SQLAlchemy ORM")
Rel(fastapi_app, redis_cache, "Reads from and writes to", "Redis Client")
Rel(fastapi_app, email_service, "Sends emails via", "SMTP/API")
Rel_U(Person(user, "User"), web_app, "Interacts with")

@enduml
```

---

# README.md

This is the main README for the entire project. For detailed instructions specific to the backend or frontend, please refer to their respective `README.md` files.

## Project Title: Enterprise-Grade Authentication System

This project provides a full-stack, comprehensive authentication and authorization solution. It's built with a Python FastAPI backend and a React frontend, leveraging modern tools and best practices for security, scalability, and maintainability.

### Features:

**Backend (FastAPI):**
*   **User Management:** Register, Login, User Profile CRUD.
*   **Authentication:** JWT (JSON Web Tokens) based with Access and Refresh tokens.
*   **Authorization:** Role-Based Access Control (RBAC) with `User`, `Admin` roles.
*   **Password Hashing:** Secure password storage using `bcrypt`.
*   **Email Verification:** Account activation via email links.
*   **Password Reset:** Secure "forgot password" flow with email links.
*   **Token Refresh & Blacklisting:** Secure refresh token mechanism with logout-based invalidation (using Redis).
*   **API Endpoints:** RESTful API with full CRUD operations for users (admin-only) and self-service for authenticated users.
*   **Error Handling:** Centralized custom exception handling.
*   **Logging:** Structured logging for requests, errors, and application events.
*   **Rate Limiting:** Protects against abuse on login, registration, and password reset endpoints (using Redis).
*   **Database:** PostgreSQL with SQLAlchemy ORM and Alembic for migrations.
*   **Configuration:** Pydantic-based settings loaded from environment variables.
*   **Caching:** Redis for refresh token invalidation and rate limiting.
*   **Testing:** Unit, integration, and API tests using `pytest`.
*   **Documentation:** Automatic OpenAPI (Swagger UI) documentation generated by FastAPI.

**Frontend (React):**
*   **User Interface:** Clean and responsive UI for registration, login, dashboard, user profile, and admin panel.
*   **Authentication Flow:** Handles JWT tokens (access & refresh), stores them securely (HTTP-only cookies recommended in production, but localStorage/sessionStorage used for simplicity in this example).
*   **Protected Routes:** Client-side routing with authentication guards.
*   **Role-Based UI:** Shows/hides UI elements based on user roles.
*   **API Integration:** Uses Axios for seamless communication with the FastAPI backend.
*   **State Management:** React Context API for managing authentication state.
*   **Error Display:** User-friendly error messages.

**Infrastructure & DevOps:**
*   **Docker & Docker Compose:** Containerized setup for easy local development and deployment.
*   **Environment Configuration:** `.env` files for managing sensitive credentials and settings.
*   **CI/CD (Placeholder):** Configuration for GitHub Actions/GitLab CI.

### Technology Stack:

*   **Backend:** Python 3.9+, FastAPI, SQLAlchemy, Alembic, Pydantic, PyJWT, Passlib, Uvicorn, Redis, PostgreSQL.
*   **Frontend:** React 18+, React Router DOM, Axios, `jwt-decode`.
*   **Database:** PostgreSQL.
*   **Caching/Rate Limiting:** Redis.
*   **Containerization:** Docker, Docker Compose.

### Getting Started

#### Prerequisites:

*   Docker and Docker Compose
*   A text editor (VS Code recommended)

#### 1. Clone the repository:

```bash
git clone https://github.com/your-username/authentication-system.git
cd authentication-system
```

#### 2. Environment Setup:

Create `.env` files for both backend and frontend based on the provided examples.

*   `backend/.env`:
    ```ini
    # Database Configuration
    DATABASE_URL=postgresql+asyncpg://user:password@db:5432/auth_db

    # JWT Configuration
    SECRET_KEY=YOUR_SUPER_SECRET_KEY_FOR_JWT # CHANGE THIS!
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=15
    REFRESH_TOKEN_EXPIRE_DAYS=7

    # Email Configuration (for verification and password reset)
    MAIL_USERNAME=your_email@example.com
    MAIL_PASSWORD=your_email_password
    MAIL_FROM_EMAIL=your_email@example.com
    MAIL_FROM_NAME="Auth System"
    MAIL_SERVER=smtp.example.com
    MAIL_PORT=587
    MAIL_USE_TLS=True

    # Redis Configuration
    REDIS_URL=redis://redis:6379/0

    # Frontend URL (for email links)
    FRONTEND_URL=http://localhost:3000
    ```
    *   **Important:** Replace `YOUR_SUPER_SECRET_KEY_FOR_JWT` with a strong, random string. You can generate one with `openssl rand -hex 32`.

*   `frontend/.env`:
    ```ini
    REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
    ```

#### 3. Start the Services with Docker Compose:

Navigate to the root of the project and run:

```bash
docker-compose up --build -d
```

This command will:
*   Build Docker images for the backend and frontend.
*   Start a PostgreSQL database container.
*   Start a Redis cache container.
*   Start the FastAPI backend server.
*   Start the React development server.

#### 4. Run Database Migrations and Seed Data:

Once the `db` and `backend` services are up, you need to apply migrations.

```bash
# Connect to the backend container
docker-compose exec backend bash

# Inside the backend container, apply migrations
alembic upgrade head

# Seed initial data (e.g., admin user, roles)
python -m app.utils.seed_db

# Exit the container
exit
```

#### 5. Access the Application:

*   **Frontend:** Open your browser and navigate to `http://localhost:3000`
*   **Backend API Docs (Swagger UI):** `http://localhost:8000/docs`
*   **Backend API Docs (Redoc):** `http://localhost:8000/redoc`

You should be able to register new users, log in, manage profiles, and, if you're the seeded admin user, access the admin panel.

### Testing

#### Backend Tests:

```bash
# Connect to the backend container
docker-compose exec backend bash

# Run pytest (inside the container)
pytest

# To see coverage report
pytest --cov=app --cov-report=term-missing
```

#### Frontend Tests:

```bash
# Connect to the frontend container
docker-compose exec frontend bash

# Run Jest tests (inside the container)
npm test

# To see coverage report (if configured, e.g., with 'npm test -- --coverage')
```

### CI/CD (Placeholder)

Placeholders for CI/CD pipeline configurations are provided in `.gitlab-ci.yml` and `.github/workflows/main.yml`. These files outline typical steps for building, testing, and deploying the application. You'll need to adapt them to your specific CI/CD provider and deployment strategy.

### Deployment Guide

The `docker-compose.yml` provides a good starting point for production deployment. For a true enterprise-grade deployment, consider:

*   **Load Balancer/Reverse Proxy:** Use Nginx or a cloud load balancer (e.g., AWS ALB, GCP Load Balancer) to route traffic, handle SSL termination, and potentially implement advanced rate limiting.
*   **Scalability:** Deploy multiple instances of the FastAPI backend behind a load balancer. The database (PostgreSQL) can be managed by a cloud provider (AWS RDS, GCP Cloud SQL) for easier scaling and maintenance.
*   **Security:**
    *   Ensure all secrets are managed via a secure secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) and not directly in `.env` files in production.
    *   Use HTTPS everywhere.
    *   Regularly update dependencies to patch security vulnerabilities.
    *   Implement robust firewall rules.
*   **Monitoring & Logging:** Integrate with a centralized logging system (e.g., ELK Stack, Splunk, Datadog) and monitoring tools (Prometheus, Grafana).
*   **Database Backups:** Implement regular automated database backups.
*   **CI/CD Automation:** Fully automate deployments using your chosen CI/CD pipeline.

### Contributing

Contributions are welcome! Please follow standard practices:
1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes and write tests.
4.  Ensure all tests pass and coverage remains high.
5.  Submit a pull request.

### License

This project is open-source and available under the MIT License.

---

### File Separators

```python