# Enterprise-Grade Authentication System

This project implements a comprehensive, production-ready authentication system featuring a C++ backend (Pistache) and a modern JavaScript frontend (React/Next.js). It's designed with modularity, scalability, and security in mind, providing a full-stack solution for user authentication and authorization.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (without Docker)](#local-development-setup-without-docker)
    *   [Docker Setup (Recommended)](#docker-setup-recommended)
4.  [API Documentation](#api-documentation)
5.  [Database](#database)
6.  [Testing](#testing)
7.  [CI/CD](#ci/cd)
8.  [Additional Features](#additional-features)
9.  [Deployment](#deployment)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

## 1. Features

This system provides:

*   **User Management**: Registration, Login, Profile Management (view/update).
*   **Authentication**: JWT (JSON Web Token) based authentication with Access and Refresh Tokens.
*   **Authorization**: Role-based access control (User, Admin roles) using middleware.
*   **API**: RESTful API endpoints with full CRUD operations for users (admin-only) and self-service profile updates.
*   **Security**: Password hashing (bcrypt), secure JWT handling, basic rate limiting.
*   **Observability**: Structured logging (spdlog for C++), error handling middleware.
*   **Scalability**: Stateless JWTs, Dockerized services.
*   **Quality**: Unit and Integration tests.
*   **Documentation**: Comprehensive README, API docs, Architecture docs.

## 2. Architecture

The system follows a microservices-inspired architecture:

*   **Frontend**: A React/Next.js application providing the user interface for registration, login, and profile viewing. It communicates with the C++ backend via RESTful API calls.
*   **Backend**: A C++ application built with the `Pistache` web framework. It handles all business logic related to authentication, user management, and API request processing.
*   **Database**: PostgreSQL is used as the primary data store for user information.

### Components of the C++ Backend:

*   **HTTP Server**: `Pistache` for handling incoming API requests.
*   **Configuration**: Loads environment variables from `.env` files.
*   **Logger**: `spdlog` for structured, color-coded logging.
*   **Database Manager**: `pqxx` for interacting with PostgreSQL, including connection pooling (implicit via `pqxx::connection` management) and prepared statements.
*   **Models**: C++ classes representing database entities (e.g., `User`).
*   **Utilities**:
    *   `PasswordHasher`: Implements `bcrypt` for secure password storage and verification.
    *   `JWTManager`: Handles generation, decoding, and verification of JWTs (access and refresh tokens) using `jwt-cpp`.
*   **Middleware**:
    *   `ErrorMiddleware`: Centralized error handling for consistent API responses.
    *   `AuthMiddleware`: Authenticates requests using JWTs and extracts user context.
    *   `RateLimitMiddleware`: Basic in-memory IP-based rate limiting to prevent abuse.
*   **Handlers**: Implement the business logic for specific API routes (e.g., `AuthHandler` for register/login, `UserHandler` for profile/admin operations).

For a detailed architectural diagram and description, refer to [Architecture.md](Architecture.md).

## 3. Getting Started

### Prerequisites

*   **Git**: For cloning the repository.
*   **Docker & Docker Compose**: (Highly Recommended) For easy setup and running all services.
    *   Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
*   **C++ Toolchain**: (If running backend locally)
    *   C++17 compatible compiler (GCC, Clang, MSVC)
    *   CMake (>= 3.15)
    *   Vcpkg (for C++ dependency management)
*   **Node.js & npm/yarn**: (If running frontend locally)
    *   Node.js (LTS version, e.g., 18.x or 20.x)
    *   npm (comes with Node.js) or Yarn

### Local Development Setup (without Docker)

This setup is more complex as it requires manual installation and configuration of all dependencies.

#### a. PostgreSQL Database
1.  **Install PostgreSQL**: Follow instructions for your OS.
2.  **Create Database and User**:
    ```bash
    sudo -u postgres psql
    CREATE USER authuser WITH PASSWORD 'authpassword';
    CREATE DATABASE authdb OWNER authuser;
    \q
    ```
3.  **Run Migrations**:
    ```bash
    psql -U authuser -d authdb -h localhost -f scripts/db_migrations/V1__create_users_table.sql
    psql -U authuser -d authdb -h localhost -f scripts/db_migrations/V2__seed_admin_user.sql
    ```

#### b. C++ Backend
1.  **Install Vcpkg**:
    ```bash
    git clone https://github.com/microsoft/vcpkg.git
    ./vcpkg/bootstrap-vcpkg.sh
    ./vcpkg/vcpkg integrate install
    ```
2.  **Install C++ Dependencies**:
    ```bash
    cd backend
    vcpkg install --triplet x64-linux # or appropriate triplet for your OS
    ```
3.  **Configure Environment**:
    Create a `.env.backend` file in the `backend/` directory, copying contents from `.env.backend.example` and adjusting `DB_HOST` to `localhost`.
4.  **Build and Run**:
    ```bash
    mkdir build && cd build
    cmake .. -DCMAKE_TOOLCHAIN_FILE=/path/to/vcpkg/scripts/buildsystems/vcpkg.cmake # Adjust path to vcpkg
    cmake --build .
    ./auth_server
    ```
    The server should start on `http://localhost:9080`.

#### c. Frontend (React/Next.js)
1.  **Install Node.js Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Configure Environment**:
    Create a `.env.frontend` file in the `frontend/` directory, copying contents from `.env.frontend.example`. Ensure `NEXT_PUBLIC_API_BASE_URL` points to your backend (e.g., `http://localhost:9080`).
3.  **Run Frontend**:
    ```bash
    npm run dev
    ```
    The frontend should be accessible at `http://localhost:3000`.

### Docker Setup (Recommended)

This is the easiest way to get the entire stack running.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/authentication-system.git
    cd authentication-system
    ```
2.  **Environment Variables**:
    Create a `.env` file in the project root directory (next to `docker-compose.yml`) for shared environment variables.
    You can copy and combine settings from `backend/.env.backend.example` and `frontend/.env.frontend.example`.
    Example `.env` (customize secrets!):
    ```
    # Database
    DB_USER=authuser
    DB_PASSWORD=authpassword
    DB_NAME=authdb

    # JWT Secrets (GENERATE NEW, STRONG SECRETS!)
    JWT_SECRET=your_super_secret_jwt_key_for_access_tokens_GENERATED_SECURELY
    JWT_REFRESH_SECRET=your_super_secret_jwt_key_for_refresh_tokens_GENERATED_SECURELY
    JWT_ACCESS_TOKEN_EXPIRATION_MINUTES=15
    JWT_REFRESH_TOKEN_EXPIRATION_MINUTES=1440

    # Server Port
    HTTP_PORT=9080

    # Rate Limiting
    RATE_LIMIT_MAX_REQUESTS=100
    RATE_LIMIT_WINDOW_SECONDS=60

    # Frontend API URL
    NEXT_PUBLIC_API_BASE_URL=http://localhost:9080
    ```
3.  **Build and Run with Docker Compose**:
    ```bash
    docker-compose build
    docker-compose up
    ```
    *   `docker-compose build`: Builds the Docker images for backend and frontend. This can take some time, especially for the C++ backend on the first run as it compiles C++ dependencies and the application.
    *   `docker-compose up`: Starts all services (PostgreSQL, Backend, Frontend).

    Once all services are up:
    *   **Backend API**: `http://localhost:9080`
    *   **Frontend UI**: `http://localhost:3000`

4.  **Stop Services**:
    ```bash
    docker-compose down
    ```
    To also remove volumes (database data):
    ```bash
    docker-compose down -v
    ```

## 4. API Documentation

Detailed API documentation, including endpoints, methods, request/response formats, and authentication requirements, is available in [API.md](API.md).

## 5. Database

*   **Database**: PostgreSQL
*   **Schema**: Defined in `scripts/db_migrations/V1__create_users_table.sql`.
*   **Migrations**: SQL scripts under `scripts/db_migrations/` are automatically applied by Docker Compose on first startup for the `db` service.
*   **Seed Data**: `scripts/db_migrations/V2__seed_admin_user.sql` creates a default `admin` user with password `adminpassword123`. **CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION.**

## 6. Testing

The project emphasizes thorough testing:

*   **Unit Tests**: Located in `backend/tests/unit/`. Implemented using Google Test framework, aiming for high coverage of core logic (password hashing, JWT generation, database operations). Run with `cmake --build build --target unit_tests && ./build/unit_tests` in the `backend/` directory or `docker-compose exec backend ./build/unit_tests` if using Docker.
*   **Integration Tests**: Located in `backend/tests/integration/`. Basic API integration tests using Pistache's HTTP client. These require the backend server to be running. Run with `cmake --build build --target integration_tests && ./build/integration_tests` or `docker-compose exec backend ./build/integration_tests`.
*   **API Tests**: Described conceptually in [API.md](API.md) with example `curl` commands. Postman collections or OpenAPI clients could be used.
*   **Performance Tests**: A conceptual guide for performance testing with recommended tools and scenarios is provided in [PerformanceTestingGuide.md](PerformanceTestingGuide.md).

## 7. CI/CD

A basic GitHub Actions workflow is configured in `.github/workflows/main.yml`. This workflow automates:

*   Building the C++ backend.
*   Running C++ unit and integration tests.
*   Building the Next.js frontend.
*   (Placeholder for deployment steps).

This provides a foundation for automated builds, tests, and future deployments upon code pushes/pull requests.

## 8. Additional Features

*   **Authentication/Authorization**: JWT-based (access and refresh tokens) with role-based access control (User, Admin).
*   **Logging**: `spdlog` provides structured and colored logging for the backend, making it easier to debug and monitor.
*   **Error Handling**: Centralized middleware catches exceptions and returns consistent JSON error responses.
*   **Caching Layer**: A simple in-memory cache is used for rate limiting (storing IP addresses and request timestamps). For more advanced caching (e.g., for user sessions), Redis would be integrated.
*   **Rate Limiting**: IP-based rate limiting prevents brute-force attacks and abuse of API endpoints.

## 9. Deployment

The Docker Compose setup is production-ready for basic deployment. For a full enterprise deployment, consider:

*   **Orchestration**: Kubernetes or Docker Swarm for managing containers at scale.
*   **Reverse Proxy**: Nginx or Caddy for SSL termination, load balancing, and static file serving.
*   **Monitoring**: Integrate Prometheus/Grafana for comprehensive metrics, ELK stack for centralized logging.
*   **Security**: Implement HTTPS/SSL, consider a WAF (Web Application Firewall), regular security audits.
*   **Database Management**: Use managed database services (e.g., AWS RDS, Azure Database for PostgreSQL) for high availability, backups, and scalability.

A simple deployment flow:

1.  Provision a Linux VM/server.
2.  Install Docker and Docker Compose.
3.  Clone repository, configure `.env` with production secrets.
4.  Run `docker-compose up -d --build`.
5.  Configure a reverse proxy (e.g., Nginx) to route traffic to frontend (port 3000) and backend (port 9080).

## 10. Future Enhancements

*   **Advanced User Features**: Password reset via email, email verification, multi-factor authentication (MFA).
*   **Admin Panel**: A dedicated UI for admin users to manage users, roles, and other system settings.
*   **Token Blacklisting/Whitelisting**: For immediate invalidation of refresh tokens on logout or compromise.
*   **Container Registry**: Push Docker images to a private registry (e.g., Docker Hub, AWS ECR) in CI/CD.
*   **Database Migrations Tool**: Use a dedicated tool like Flyway (Java) or Alembic (Python) for robust schema evolution, triggered as part of CI/CD.
*   **More Robust Caching**: Integrate Redis for distributed caching, session management, and more sophisticated rate limiting.
*   **Auditing**: Log all security-sensitive actions (login attempts, password changes, admin actions) to an audit log.
*   **Telemetry**: Integrate OpenTelemetry for distributed tracing.

## 11. License

This project is open-sourced under the MIT License. See the `LICENSE` file for details.
```

### `Architecture.md`
```markdown