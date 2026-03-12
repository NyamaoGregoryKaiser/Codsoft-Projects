# SecureAuth System

**Comprehensive, Production-Ready Full-Stack Authentication System**

SecureAuth is a robust web application built to demonstrate enterprise-grade authentication and authorization practices. It features a Python Flask backend, a React frontend, PostgreSQL database, Redis for caching/rate limiting, Docker for containerization, and a suite of quality assurance tools and documentation.

## Table of Contents

1.  [Features](#features)
2.  [Technologies](#technologies)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (Docker Compose)](#local-development-docker-compose)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
5.  [Running the Application](#running-the-application)
6.  [Database Management](#database-management)
    *   [Migrations](#migrations)
    *   [Seeding Initial Data](#seeding-initial-data)
7.  [API Documentation](#api-documentation)
8.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Testing (Concept)](#performance-testing-concept)
9.  [CI/CD Configuration](#cicd-configuration)
10. [Architecture Documentation](#architecture-documentation)
11. [Deployment Guide](#deployment-guide)
12. [Additional Features Details](#additional-features-details)
13. [License](#license)

---

## 1. Features

*   **User Authentication:** Registration, Login, Logout, Password Reset (via email).
*   **JWT (JSON Web Token):** Access and Refresh tokens, token blacklisting for immediate logout.
*   **Role-Based Access Control (RBAC):** `Admin` and `User` roles with protected API endpoints.
*   **User Profile Management:** View and update personal details, change password.
*   **CRUD for Protected Resources:** Example "Posts" module with creation, reading, updating, and deleting capabilities, restricted by user ownership and roles.
*   **Centralized Error Handling:** Consistent API error responses.
*   **Structured Logging:** Application logs for monitoring and debugging.
*   **Rate Limiting:** Protects API endpoints against abuse and brute-force attacks (e.g., login, registration).
*   **Caching Layer:** Redis-backed caching for frequently accessed data (e.g., all posts, user roles).
*   **Email Integration:** Simulated for password reset (configurable with real SMTP in production).
*   **Database Management:** PostgreSQL with SQLAlchemy ORM and Alembic for migrations.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **Comprehensive Testing:** Unit, Integration, and API tests for the backend.
*   **Interactive API Documentation:** Swagger UI (OpenAPI).
*   **Responsive Frontend:** React with Tailwind CSS.

## 2. Technologies

*   **Backend:** Python 3, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Bcrypt, Flask-Mail, Flask-Limiter, Flask-Caching, Flasgger, Gunicorn, Alembic.
*   **Frontend:** React, React Router DOM, Axios, Tailwind CSS, `jwt-decode`.
*   **Database:** PostgreSQL.
*   **Cache/Message Queue:** Redis.
*   **Containerization:** Docker, Docker Compose.
*   **Testing:** Pytest (Backend), Jest/React Testing Library (Frontend).

## 3. Project Structure

```
.
├── .github/                       # CI/CD workflows
│   └── workflows/
│       └── ci.yml
├── backend/                       # Flask Backend
│   ├── app/                   
│   │   ├── api/                   # API blueprints (auth, users, posts)
│   │   ├── config.py              # Configuration settings (dev, test, prod)
│   │   ├── extensions.py          # Flask extensions initialization (DB, JWT, Bcrypt, Mail, Limiter, Cache)
│   │   ├── models/                # Database models (User, Role, TokenBlacklist, Post)
│   │   ├── services/              # Business logic services (AuthService, UserService, MailService, PostService)
│   │   ├── utils/                 # Utility functions, decorators (role_required), error handling
│   │   └── __init__.py            # Application factory for Flask app creation
│   ├── migrations/                # Alembic migration scripts
│   ├── tests/                     # Backend tests (unit, integration, api)
│   ├── .env.example               # Example environment variables
│   ├── Dockerfile                 # Dockerfile for backend service
│   ├── requirements.txt           # Python dependencies
│   └── wsgi.py                    # Gunicorn entry point for production
├── frontend/                      # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Frontend API calls (axios instance)
│   │   ├── components/            # Reusable React components (Header, ProtectedRoute)
│   │   ├── context/               # React Context for global authentication state (AuthContext)
│   │   ├── hooks/                 # Custom React hooks (e.g., useAuth)
│   │   ├── pages/                 # Page-level components (Login, Register, Dashboard, Profile, Posts, AdminUsers, etc.)
│   │   ├── utils/                 # Utility functions
│   │   ├── App.js                 # Main App component with routing
│   │   ├── index.js               # React entry point
│   │   └── tailwind.css           # Tailwind CSS directives
│   ├── .env.example
│   ├── Dockerfile                 # Dockerfile for frontend service (Nginx serving static files)
│   ├── package.json               # Node.js dependencies
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── README.md
├── docker-compose.yml             # Docker Compose for multi-service orchestration (PostgreSQL, Redis, Backend, Frontend)
├── README.md                      # Main project README
└── LICENSE
```

## 4. Setup and Installation

### Prerequisites

*   **Docker** and **Docker Compose**: Essential for running the entire system easily.
*   **Python 3.8+** (for manual backend setup)
*   **Node.js 18+** and **npm** (for manual frontend setup)

### Local Development (Docker Compose - Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/secureauth-system.git
    cd secureauth-system
    ```

2.  **Create `.env` files:**
    Copy the example environment files:
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    **Edit these `.env` files:**
    *   **`backend/.env`**:
        ```
        FLASK_CONFIG=development
        DATABASE_URL=postgresql://user:password@db:5432/secureauth_db
        SECRET_KEY=YOUR_SUPER_SECRET_KEY_FOR_FLASK # Change this!
        JWT_SECRET_KEY=YOUR_SUPER_SECRET_KEY_FOR_JWT # Change this!
        MAIL_SERVER=smtp.mailtrap.io # Use a service like Mailtrap for testing emails in dev
        MAIL_PORT=2525
        MAIL_USERNAME=your_mailtrap_username
        MAIL_PASSWORD=your_mailtrap_password
        MAIL_USE_TLS=true
        MAIL_USE_SSL=false
        REDIS_URL=redis://redis:6379/0
        FRONTEND_URL=http://localhost:3000 # Important for password reset link generation
        ```
    *   **`frontend/.env`**:
        ```
        # This points to the backend API accessible from the browser
        REACT_APP_API_BASE_URL=http://localhost:5000/api 
        ```

3.  **Build and run the services:**
    This will build the Docker images, start PostgreSQL, Redis, Flask backend, and React frontend.
    ```bash
    docker-compose up --build -d
    ```
    *   `-d` runs in detached mode (in the background). Remove it to see logs.

4.  **Wait for services to initialize:**
    It might take a minute for the database to be ready and the backend to run migrations. You can check logs:
    ```bash
    docker-compose logs -f
    ```

5.  **Seed Initial Data:**
    Once the `backend` service is up and running (check logs for messages like "SecureAuth startup" and "alembic upgrade head"), execute the seed script.
    ```bash
    docker-compose exec backend python backend/seed_db.py
    ```
    This will create `Admin` and `User` roles, an admin user (`admin/AdminPassword123!`), and a regular user (`testuser/UserPassword123!`).

6.  **Access the application:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API (Swagger UI):** `http://localhost:5000/apidocs/`

### Manual Setup (Backend)

(Skip if using Docker Compose)

1.  **Create and activate a Python virtual environment:**
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Configure environment variables:**
    Create a `.env` file in the `backend/` directory based on `backend/.env.example`.
4.  **Start PostgreSQL and Redis manually.**
5.  **Run migrations:**
    ```bash
    flask db upgrade
    ```
6.  **Seed data:**
    ```bash
    python backend/seed_db.py # Or implement as a Flask CLI command
    ```
7.  **Run the Flask application:**
    ```bash
    flask run --host=0.0.0.0 --port=5000
    ```

### Manual Setup (Frontend)

(Skip if using Docker Compose)

1.  **Install Node.js dependencies:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Configure environment variables:**
    Create a `.env` file in the `frontend/` directory based on `frontend/.env.example`.
3.  **Start the React development server:**
    ```bash
    npm start
    ```
    This usually opens `http://localhost:3000` in your browser.

## 5. Running the Application

After following the Docker Compose setup:
*   Frontend: `http://localhost:3000`
*   Backend API (Swagger UI): `http://localhost:5000/apidocs/`

**Default Credentials after seeding:**
*   **Admin User:**
    *   Username: `admin`
    *   Email: `admin@example.com`
    *   Password: `AdminPassword123!`
*   **Regular User:**
    *   Username: `testuser`
    *   Email: `test@example.com`
    *   Password: `UserPassword123!`

## 6. Database Management

### Migrations

This project uses `Alembic` for database migrations.

To create a new migration (after making changes to `backend/app/models/*.py`):
```bash
docker-compose exec backend alembic revision --autogenerate -m "Description of changes"
```
To apply migrations (already part of `docker-compose up` for the backend service, but good to know):
```bash
docker-compose exec backend alembic upgrade head
```

### Seeding Initial Data

The `backend/seed_db.py` script provides initial roles (`Admin`, `User`) and default users (`admin`, `testuser`). It's designed to be idempotent. Run it using:
```bash
docker-compose exec backend python backend/seed_db.py
```

## 7. API Documentation

The backend API is documented using Swagger UI (OpenAPI 2.0).
Access it at: `http://localhost:5000/apidocs/`

This interface allows you to:
*   View all available API endpoints, their methods, and expected parameters.
*   Understand request/response schemas.
*   "Try it out" directly from the browser, including authenticating with JWT tokens.

## 8. Testing

### Backend Tests (Python/Pytest)

*   **Unit Tests:** Test individual components (models, services) in isolation.
*   **Integration Tests:** Test interactions between multiple components (e.g., a service interacting with the database).
*   **API Tests:** Test the API endpoints directly using the Flask test client.

To run backend tests with coverage:
```bash
docker-compose exec backend pytest backend/tests --cov=backend/app --cov-report=term-missing
```
**Coverage Goal:** Aim for 80%+ coverage on core logic.

### Frontend Tests (React/Jest)

Basic component tests with Jest and React Testing Library.

To run frontend tests:
```bash
docker-compose exec frontend npm test
```
(You might need to stop the `frontend` service first if it's already running `npm start`.)

### Performance Testing (Concept)

For performance testing, tools like `Locust` (Python) or `k6` (JavaScript) would be integrated.
*   Define user scenarios (login, create post, view posts).
*   Simulate concurrent users and ramp-up times.
*   Monitor response times, error rates, and throughput.

A `locustfile.py` (not provided in full due to complexity, but illustrative) would look something like this:
```python
# === backend/locustfile.py ===
# from locust import HttpUser, task, between
#
# class WebsiteUser(HttpUser):
#     wait_time = between(1, 2.5)
#     host = "http://localhost:5000"
#     token = None
#
#     def on_start(self):
#         self.client.post("/api/auth/register", json={"username": "perf_user", "email": "perf@example.com", "password": "PerfPassword123!"})
#         response = self.client.post("/api/auth/login", json={"email": "perf@example.com", "password": "PerfPassword123!"})
#         self.token = response.json()["access_token"]
#
#     @task(3)
#     def get_posts(self):
#         headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
#         self.client.get("/api/posts", headers=headers)
#
#     @task(1)
#     def create_post(self):
#         if self.token:
#             headers = {"Authorization": f"Bearer {self.token}"}
#             self.client.post("/api/posts", json={"title": "Perf Post", "content": "This is a performance test post content"}, headers=headers)
#