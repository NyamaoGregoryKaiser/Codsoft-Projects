```markdown
# Project Management API (C++ Pistache)

This is a comprehensive, production-ready API development system built primarily with C++ using the Pistache framework. It provides a robust backend for a project management application, demonstrating a full-stack approach with attention to enterprise-grade features, testing, and deployment.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Project Structure](#project-structure)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development](#local-development)
    *   [Docker Compose (Recommended)](#docker-compose-recommended)
5.  [Running the Application](#running-the-application)
6.  [Database Management](#database-management)
7.  [Testing](#testing)
    *   [Unit and Integration Tests](#unit-and-integration-tests)
    *   [API Tests](#api-tests)
    *   [Performance Tests (Conceptual)](#performance-tests-conceptual)
8.  [API Documentation](#api-documentation)
9.  [Architecture Documentation](#architecture-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Contributing](#contributing)
12. [License](#license)

## 1. Features

*   **User Management**: Register, Login, Authentication (JWT).
*   **Project Management**: CRUD operations for projects, associated with a user.
*   **Task Management**: CRUD operations for tasks, associated with a project and an assigned user.
*   **Authentication & Authorization**: JWT-based authentication middleware, basic ownership-based authorization.
*   **Logging & Monitoring**: Structured logging with `spdlog` to console and rotating files.
*   **Error Handling**: Global error handling middleware for consistent API responses.
*   **Rate Limiting**: In-memory rate limiting to protect against abuse.
*   **Database Layer**: SOCI for database abstraction, SQLite for development, PostgreSQL-ready schema and migrations.
*   **Configuration**: Environment-based configuration using JSON files and `.env`.
*   **Containerization**: Docker and Docker Compose for easy setup and deployment.
*   **Testing**: Unit tests (Google Test), Integration tests, API testing examples.
*   **CI/CD**: GitHub Actions workflow for automated builds and tests.
*   **Documentation**: Comprehensive README, API docs, Architecture docs, Deployment guide.

## 2. Technology Stack

*   **Backend**: C++17+
    *   **Web Framework**: [Pistache](https://pistache.io/)
    *   **JSON Handling**: [nlohmann/json](https://github.com/nlohmann/json)
    *   **Database ORM/Access**: [SOCI](http://soci.sourceforge.net/) (with SQLite3 and PostgreSQL backends)
    *   **JWT**: [jwt-cpp](https://github.com/Thalhammer/jwt-cpp)
    *   **Logging**: [spdlog](https://github.com/gabime/spdlog)
    *   **Testing**: [Google Test](https://github.com/google/googletest)
    *   **Build System**: CMake
*   **Database**: SQLite3 (for development/testing), PostgreSQL (for production)
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions
*   **Frontend (Placeholder)**: Simple HTML/JavaScript client (`client/`) to demonstrate API consumption.

## 3. Project Structure

```
project-management-api/
├── client/                      # Basic HTML/JS client to consume the API
├── cmake/                       # Custom CMake modules
├── config/                      # Application configuration files (e.g., logging)
├── database/                    # Database schema, migrations, seed data, and init scripts
│   ├── migrations/              # SQL migration scripts
│   ├── seed/                    # SQL seed data
│   └── init_db.sh               # Script to run migrations and seed data
├── docker/                      # Dockerfiles for application and database
├── src/                         # Core C++ application source code
│   ├── app/                     # Application-specific logic (controllers, services, middleware)
│   │   ├── controllers/         # Handles HTTP requests, calls services
│   │   ├── middleware/          # Authentication, error handling, rate limiting
│   │   └── services/            # Business logic, interacts with database
│   ├── core/                    # Core components (database manager, models, utilities)
│   │   ├── database/            # Database connection and management
│   │   ├── models/              # Data models (User, Project, Task)
│   │   └── utils/               # General utilities (Config, JWTManager, Logger)
│   └── main.cpp                 # Application entry point
├── tests/                       # Unit and Integration tests
├── .env.example                 # Example environment variables
├── .gitignore
├── .github/                     # GitHub Actions CI/CD workflow
├── CMakeLists.txt               # CMake build configuration
├── docker-compose.yml           # Docker Compose setup
├── requirements.txt             # Python dependencies (for API testing, helper scripts)
├── package.json                 # Node.js dependencies (for simple client)
├── README.md                    # This file
├── API_DOCS.md                  # Comprehensive API documentation
├── ARCHITECTURE.md              # Project architecture overview
└── DEPLOYMENT.md                # Deployment guide
```

## 4. Setup and Installation

### Prerequisites

*   **Git**: For cloning the repository.
*   **CMake**: `3.10` or higher.
*   **C++ Compiler**: C++17 compatible (e.g., GCC 7+ or Clang 5+).
*   **Pistache, SOCI, spdlog, nlohmann/json, jwt-cpp**: C++ development libraries.
    *   On Debian/Ubuntu: `sudo apt-get install build-essential cmake git libssl-dev libspdlog-dev libnlohmann-json-dev libpistache-dev libsoci-dev libsoci-sqlite3-dev libjwt-dev`
    *   `jwt-cpp` often needs to be built from source as `libjwt-dev` typically refers to a different library (`libjwt`). The `Dockerfile.app` demonstrates building `jwt-cpp` from source. You might need to do this locally as well or use a package manager like `vcpkg` or `conan`.
*   **SQLite3**: For local database development.
*   **Docker & Docker Compose**: (Recommended for easy setup) [Install Docker](https://docs.docker.com/get-docker/)

### Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/project-management-api.git
    cd project-management-api
    ```

2.  **Install C++ dependencies**:
    Ensure all C++ libraries (Pistache, SOCI, spdlog, nlohmann/json, jwt-cpp, gtest) are installed on your system.
    If you encounter issues with `jwt-cpp` or other libraries, consider using a C++ package manager like [Vcpkg](https://vcpkg.io/en/docs/quick_start.html) or [Conan](https://conan.io/downloads.html).
    
    Example manual build for `jwt-cpp` (if `libjwt-dev` is insufficient):
    ```bash
    # Install OpenSSL development files (needed by jwt-cpp)
    sudo apt-get install libssl-dev
    
    # Clone and build jwt-cpp
    git clone https://github.com/Thalhammer/jwt-cpp.git /tmp/jwt-cpp
    cd /tmp/jwt-cpp
    mkdir build && cd build
    cmake .. -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local
    make -j$(nproc)
    sudo make install
    sudo ldconfig # Update shared library cache
    cd - # Return to project root
    ```

3.  **Build the application**:
    ```bash
    mkdir build
    cd build
    cmake ..
    make
    ```

4.  **Configure environment variables**:
    Copy `.env.example` to `.env` and fill in your desired values.
    ```bash
    cp .env.example .env
    # nano .env (edit the file)
    ```
    Ensure `DB_PATH` points to a SQLite database file (e.g., `database/project_management.db`).

5.  **Initialize the database**:
    ```bash
    ./database/init_db.sh
    ```

### Docker Compose (Recommended)

This is the easiest way to get the API and a PostgreSQL database running.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/project-management-api.git
    cd project-management-api
    ```

2.  **Configure environment variables**:
    Copy `.env.example` to `.env` and fill in your desired values.
    ```bash
    cp .env.example .env
    # nano .env (edit the file)
    ```
    For Docker Compose with PostgreSQL, you might want to uncomment and update `DB_PATH` in `docker-compose.yml` to point to the PostgreSQL service (e.g., `postgresql://appuser:password@db:5432/project_management_db`). For SQLite-in-Docker, keep the default `DB_PATH`.

3.  **Build and run with Docker Compose**:
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build `Dockerfile.db` for the PostgreSQL database.
    *   Build `Dockerfile.app` for the C++ API application.
    *   Start both services.
    *   Wait for the database to become healthy.
    *   The API container will run `init_db.sh` using the SQLite database volume, or connect to PostgreSQL as configured.

## 5. Running the Application

*   **Locally (after `make` and `init_db.sh`)**:
    ```bash
    cd build
    ./ProjectManagementAPI
    ```
    The API will start on `http://0.0.0.0:9080` (or configured host/port).

*   **With Docker Compose**:
    ```bash
    docker-compose up -d
    # To view logs:
    docker-compose logs -f api
    ```
    The API will be accessible at `http://localhost:9080`.

*   **Accessing the client (optional)**:
    If you have the `package.json` setup, you can open the simple HTML client:
    ```bash
    npm install # Only if client dependencies are needed, currently none.
    npm run start-client # This opens client/index.html in your browser
    ```
    Otherwise, simply open `client/index.html` in your web browser. It will interact with the API at `http://localhost:9080`.

## 6. Database Management

*   **Migrations**: SQL scripts are located in `database/migrations/`. They are applied in version order by `database/init_db.sh`.
*   **Seed Data**: Initial data for testing/development is in `database/seed/seed_data.sql`. It's applied by `init_db.sh` if the `users` table is empty.
*   **Updating Schema**:
    1.  Create a new SQL file in `database/migrations/` (e.g., `004_add_new_column.sql`).
    2.  Add your `ALTER TABLE` or `CREATE TABLE` statements.
    3.  Run `database/init_db.sh` (or `docker-compose up --build -d` if using Docker with SQLite volumes) to apply.
    *   **Note on PostgreSQL**: If using PostgreSQL, you'll need to adapt `init_db.sh` to use `psql` commands instead of `sqlite3`, and ensure the migration scripts are compatible with PostgreSQL syntax. The provided scripts are commented for both. A dedicated migration tool like [Flyway](https://flywaydb.org/) is recommended for production PostgreSQL.

## 7. Testing

### Unit and Integration Tests

The project uses Google Test for C++ unit and integration tests.

*   **Run tests (after building)**:
    ```bash
    cd build
    ./run_tests
    ```
    This will execute all tests defined in the `tests/` directory.

### API Tests

API tests are demonstrated conceptually via a Python script in the CI/CD pipeline and can be run using `curl` or a dedicated Python script (using `requests`).

*   **Manual `curl` examples**:

    1.  **Register User**:
        ```bash
        curl -X POST -H "Content-Type: application/json" -d '{"username":"devuser","email":"dev@example.com","password":"password"}' http://localhost:9080/api/auth/register
        ```
    2.  **Login User**: (Get `JWT_TOKEN` from response)
        ```bash
        curl -X POST -H "Content-Type: application/json" -d '{"email":"dev@example.com","password":"password"}' http://localhost:9080/api/auth/login
        ```
    3.  **Create Project**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name":"My First Project","description":"Managing tasks for my first C++ project."}' http://localhost:9080/api/projects
        ```
    4.  **Get All Projects**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        curl -X GET -H "Authorization: Bearer $JWT_TOKEN" http://localhost:9080/api/projects
        ```
    5.  **Get Project by ID**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        PROJECT_ID="<project_id_from_above>"
        curl -X GET -H "Authorization: Bearer $JWT_TOKEN" http://localhost:9080/api/projects/$PROJECT_ID
        ```
    6.  **Update Project**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        PROJECT_ID="<project_id_to_update>"
        curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"name":"Updated Project Name","description":"This description has been updated."}' http://localhost:9080/api/projects/$PROJECT_ID
        ```
    7.  **Create Task**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        PROJECT_ID="<project_id_for_task>"
        USER_ID="<user_id_for_assignment, e.g., 1 for devuser>"
        curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $JWT_TOKEN" -d '{"title":"Implement Auth","description":"Add JWT authentication middleware.","project_id":'$PROJECT_ID',"assigned_user_id":'$USER_ID',"status":"IN_PROGRESS","due_date":"2024-03-15T17:00:00Z"}' http://localhost:9080/api/tasks
        ```
    8.  **Delete Task**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        TASK_ID="<task_id_to_delete>"
        curl -X DELETE -H "Authorization: Bearer $JWT_TOKEN" http://localhost:9080/api/tasks/$TASK_ID
        ```
    9.  **Delete Project**:
        ```bash
        JWT_TOKEN="<your_jwt_token_here>"
        PROJECT_ID="<project_id_to_delete>"
        curl -X DELETE -H "Authorization: Bearer $JWT_TOKEN" http://localhost:9080/api/projects/$PROJECT_ID
        ```

### Performance Tests (Conceptual)

As mentioned in the `Testing & Quality` section, performance tests are crucial for enterprise-grade applications. Tools like `k6`, `JMeter`, or `Locust` can be used. A conceptual `k6` script is provided in `API_DOCS.md` demonstrating how to simulate load and measure key metrics.

## 8. API Documentation

Detailed API documentation with example requests and responses can be found in [API_DOCS.md](API_DOCS.md).

## 9. Architecture Documentation

An overview of the system's architecture, design decisions, and component interactions is available in [ARCHITECTURE.md](ARCHITECTURE.md).

## 10. Deployment Guide

Instructions for deploying the application to production environments are detailed in [DEPLOYMENT.md](DEPLOYMENT.md).

## 11. Contributing

Feel free to open issues, submit pull requests, or suggest improvements.

## 12. License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```