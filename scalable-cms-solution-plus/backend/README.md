# CMS System Backend (C++)

This is the backend component of the Content Management System, built using C++ with the Drogon web framework. It provides a RESTful API for managing users, authentication, content (posts), and categories.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [Local Development (without Docker)](#local-development-without-docker)
  - [Docker Compose](#docker-compose)
- [Running the Application](#running-the-application)
- [Database Management](#database-management)
- [Testing](#testing)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

*   **User Management**: Register, Login, Logout, User Profiles.
*   **Role-Based Access Control (RBAC)**: Differentiated access for Guests, Users, Editors, and Administrators.
*   **Content Management (Posts)**: CRUD operations for articles, including status (Draft, Published, Archived).
*   **Category Management**: CRUD operations for content categorization.
*   **Authentication**: Secure JWT-based authentication and refresh token mechanisms.
*   **Caching**: Redis integration for session management and token blacklisting.
*   **Logging**: Structured logging using `spdlog`.
*   **Error Handling**: Centralized API error responses.
*   **Containerization**: Docker and Docker Compose setup for easy deployment.
*   **CI/CD**: GitHub Actions configuration for automated testing and deployment.
*   **Comprehensive Testing**: Unit and Integration tests.

## Technologies

*   **Language**: C++17/20
*   **Web Framework**: [Drogon](https://drogon.org/)
*   **Database**: PostgreSQL
*   **Cache/Message Broker**: Redis
*   **Authentication**: JWT-CPP library for JSON Web Tokens
*   **Password Hashing**: `libbcrypt` for bcrypt hashing
*   **Logging**: `spdlog`
*   **Build System**: CMake
*   **Testing**: Google Test

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   **Git**: For cloning the repository.
*   **Docker & Docker Compose**: (Recommended for easy setup) [Install Docker](https://docs.docker.com/get-docker/)
*   **C++ Compiler**: GCC 9+ or Clang 9+
*   **CMake**: 3.10+
*   **PostgreSQL Development Libraries**: `libpq-dev` (on Debian/Ubuntu), `postgresql-devel` (on Fedora/RHEL)
*   **Redis Development Libraries**: `libhiredis-dev` (on Debian/Ubuntu), `hiredis-devel` (on Fedora/RHEL)
*   **UUID Development Libraries**: `uuid-dev` (on Debian/Ubuntu), `libuuid-devel` (on Fedora/RHEL)
*   **JsonCPP Development Libraries**: `libjsoncpp-dev` (on Debian/Ubuntu), `jsoncpp-devel` (on Fedora/RHEL)
*   **libbcrypt Development Libraries**: `libbcrypt-dev` (on Debian/Ubuntu), `libbcrypt-devel` (on Fedora/RHEL)

## Setup & Installation

You can set up the project either using Docker Compose (recommended for full environment) or for local development directly on your machine.

### Local Development (without Docker)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/cms-system.git
    cd cms-system/backend
    ```

2.  **Install system dependencies**:
    For Ubuntu/Debian:
    ```bash
    sudo apt update
    sudo apt install build-essential cmake git libjsoncpp-dev libpq-dev libssl-dev uuid-dev libhiredis-dev libbcrypt-dev pkg-config
    ```
    For other distributions, adjust package names accordingly.

3.  **Install PostgreSQL and Redis**:
    Ensure you have a running PostgreSQL and Redis instance. You can install them locally or use Docker for just these services:
    ```bash
    # Example for PostgreSQL (Ubuntu)
    sudo apt install postgresql postgresql-contrib
    sudo -u postgres psql -c "CREATE USER cmsuser WITH PASSWORD 'cms_password';"
    sudo -u postgres psql -c "CREATE DATABASE cms_db OWNER cmsuser;"

    # Example for Redis (Ubuntu)
    sudo apt install redis-server
    ```
    Update `backend/config/default.json` or create `backend/config/development.json` to match your local database/Redis credentials if they differ from the defaults.

4.  **Build the application**:
    ```bash
    mkdir build
    cd build
    cmake ..
    make
    ```

5.  **Run database migrations**:
    Before running the app, apply schema and seed data.
    ```bash
    # Ensure psql client is installed (usually part of postgresql-client)
    # Replace 'localhost' if your DB is elsewhere
    export PGPASSWORD=cms_password
    psql -h localhost -U cmsuser -d cms_db -f ../migrations/001_create_tables.sql
    psql -h localhost -U cmsuser -d cms_db -f ../migrations/002_add_roles_and_admin_user.sql
    unset PGPASSWORD
    ```

### Docker Compose (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/cms-system.git
    cd cms-system
    ```

2.  **Configure environment variables**:
    Create a `.env` file in the root `cms-system/` directory based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Adjust the values in `.env` if needed.

3.  **Build and run services**:
    ```bash
    docker-compose -f backend/docker/docker-compose.yml up --build -d
    ```
    This will:
    *   Build the `backend` Docker image.
    *   Pull `postgres` and `redis` images.
    *   Start all three services (`db`, `redis`, `backend`).
    *   Run database migrations and seed data automatically through `docker-entrypoint-initdb.d` volume mount.
    *   Build and serve the `frontend` application (if configured in docker-compose).

## Running the Application

*   **If using Docker Compose**:
    The backend will be accessible at `http://localhost:8080`.
    The frontend (if configured) will be at `http://localhost:3000`.

*   **If local development (without Docker)**:
    ```bash
    cd cms-system/backend/build
    ./CMSSystem
    ```
    The application will listen on `http://0.0.0.0:8080` by default.

## Database Management

*   **Migrations**: SQL migration scripts are located in `backend/migrations/`. These are automatically applied by Docker Compose on the first run. For local setup, you need to run them manually.
*   **Seed Data**: `002_add_roles_and_admin_user.sql` provides initial data, including an admin user (`admin@example.com` / `admin_password`). **Change this in production!**

## Testing

Navigate to the `backend/build` directory and run:

```bash
make test
# Or run specific tests
./tests/unit_tests
./tests/integration_tests
```

*   **Unit Tests**: Located in `backend/tests/unit/`. Focus on individual components (e.g., `PasswordHasher`, `AuthService`).
*   **Integration Tests**: Located in `backend/tests/integration/`. Test API endpoints using an in-memory or separate test database instance.

## Configuration

The application loads configuration from `backend/config/default.json`. You can override settings by creating `backend/config/development.json`, `backend/config/production.json`, etc.

Environment variables (e.g., `DB_HOST`, `JWT_SECRET`) set in the `.env` file (for Docker Compose) will also influence runtime configuration, overriding settings in JSON files where applicable.

Key configuration options:
*   `http_host`, `http_port`: Server listening address and port.
*   `jwt_secret`: Secret key for signing JWTs. **CRITICAL: Change this for production!**
*   `database`: PostgreSQL connection details.
*   `redis_host`, `redis_port`: Redis connection details.
*   `log_path`, `log_level`: Logging settings.

## API Endpoints

A detailed API documentation is available in `docs/API.md`.
Summary of main endpoints:

*   **Authentication**:
    *   `POST /api/v1/auth/register`
    *   `POST /api/v1/auth/login`
    *   `POST /api/v1/auth/refresh`
    *   `POST /api/v1/auth/logout` (Requires authentication)

*   **Users**: (Admin/Authenticated only, depending on route)
    *   `GET /api/v1/users` (Admin)
    *   `GET /api/v1/users/{id}` (Admin)
    *   `GET /api/v1/users/profile` (Authenticated User)
    *   `PUT /api/v1/users/{id}` (Admin)
    *   `DELETE /api/v1/users/{id}` (Admin)

*   **Categories**:
    *   `POST /api/v1/categories` (Admin/Editor)
    *   `GET /api/v1/categories` (Authenticated)
    *   `GET /api/v1/categories/{id}` (Authenticated)
    *   `PUT /api/v1/categories/{id}` (Admin/Editor)
    *   `DELETE /api/v1/categories/{id}` (Admin/Editor)

*   **Posts**:
    *   `POST /api/v1/posts` (Authenticated)
    *   `GET /api/v1/posts` (Public/Authenticated)
    *   `GET /api/v1/posts/{id}` (Public/Authenticated)
    *   `PUT /api/v1/posts/{id}` (Author/Admin/Editor)
    *   `DELETE /api/v1/posts/{id}` (Author/Admin/Editor)
    *   `POST /api/v1/posts/{id}/publish` (Admin/Editor)
    *   `POST /api/v1/posts/{id}/draft` (Admin/Editor)

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
```