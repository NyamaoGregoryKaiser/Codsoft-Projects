# Performance Monitoring System

This is a comprehensive, production-ready Performance Monitoring System designed to track and visualize key metrics for your applications and microservices. It features a robust C++ backend API, a modern React.js frontend, and a PostgreSQL database.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Architecture](#architecture)
3.  [Features](#features)
4.  [Technology Stack](#technology-stack)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Cloning the Repository](#cloning-the-repository)
    *   [Environment Variables](#environment-variables)
    *   [Building and Running with Docker Compose](#building-and-running-with-docker-compose)
    *   [Accessing the Application](#accessing-the-application)
    *   [Running without Docker (Development)](#running-without-docker-development)
6.  [Database](#database)
    *   [Schema](#schema)
    *   [Migrations](#migrations)
    *   [Seed Data](#seed-data)
7.  [API Documentation](#api-documentation)
    *   [Authentication](#authentication)
    *   [User Management](#user-management)
    *   [Application Management](#application-management)
    *   [Metric Definitions](#metric-definitions)
    *   [Metric Data Ingestion](#metric-data-ingestion)
    *   [Metric Data Retrieval](#metric-data-retrieval)
8.  [Testing](#testing)
    *   [Unit Tests (C++)](#unit-tests-c)
    *   [Integration Tests (C++)](#integration-tests-c)
    *   [API Tests](#api-tests)
    *   [Performance Tests](#performance-tests)
9.  [CI/CD](#ci-cd)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

## Project Overview

The Performance Monitoring System allows developers and operations teams to:

*   Register and manage multiple applications or services.
*   Define custom metrics (e.g., CPU utilization, memory usage, request latency, error rates) for each application.
*   Ingest metric data points in real-time via a dedicated API endpoint.
*   Visualize metric trends and historical data through an interactive web dashboard.
*   Secure access with user authentication and authorization.

## Architecture

The system follows a typical microservices-oriented architecture, with a clear separation between the frontend, backend API, and database. Nginx acts as a reverse proxy, serving the static frontend assets and forwarding API requests to the C++ backend.

```
+------------------+     +------------------+     +--------------------+
|  User Browser    | <-> |      Nginx       | <-> |   C++ Backend API  |
| (React Frontend) |     | (Reverse Proxy)  |     | (cpp-httplib, JWT, |
+------------------+     +------------------+     |  Caching, spdlog)  |
                                                  +--------------------+
                                                            |
                                                            V
                                                  +--------------------+
                                                  |    PostgreSQL      |
                                                  | (pqxx, Migrations) |
                                                  +--------------------+

+---------------------+    +---------------------+    +---------------------+
| External App/Agent  | -> | Metric Ingestion API| -> | PostgreSQL          |
| (Pushing Metrics)   |    +---------------------+    +---------------------+
```

## Features

*   **User Authentication & Authorization:** Secure login/registration with JWT.
*   **Application Management:** CRUD operations for applications.
*   **Metric Definition Management:** Define custom metric types for applications.
*   **Real-time Metric Ingestion:** High-throughput API endpoint for agents to push metric data.
*   **Metric Visualization:** Interactive charts on the frontend to display historical metric data.
*   **Caching:** In-memory caching for frequently accessed data to improve API response times.
*   **Rate Limiting:** Basic IP-based rate limiting to prevent abuse.
*   **Centralized Logging:** Structured logging for backend operations.
*   **Error Handling:** Robust error handling with standardized API error responses.
*   **Dockerized Deployment:** Easy setup and deployment using Docker and Docker Compose.
*   **CI/CD Pipeline:** Automated build, test, and deployment workflows with GitHub Actions.

## Technology Stack

**Backend:**
*   **Language:** C++17/20
*   **Web Framework:** `cpp-httplib`
*   **JSON Handling:** `nlohmann/json`
*   **Database Client:** `pqxx` (PostgreSQL C++ client)
*   **Logging:** `spdlog`
*   **Build System:** CMake
*   **Dependency Management:** `vcpkg`
*   **Testing:** Google Test

**Frontend:**
*   **Framework:** React.js
*   **Routing:** `react-router-dom`
*   **State Management:** React Context API (or local state)
*   **Charting:** `react-chartjs-2` (Chart.js)
*   **HTTP Client:** `axios`
*   **Styling:** Pure CSS / TailwindCSS (or similar)
*   **Build Tool:** Vite (or Create React App)

**Database:**
*   **RDBMS:** PostgreSQL

**Infrastructure:**
*   **Containerization:** Docker
*   **Orchestration:** Docker Compose
*   **Reverse Proxy/Web Server:** Nginx
*   **CI/CD:** GitHub Actions

## Setup and Installation

### Prerequisites

*   Docker Desktop
*   Git

### Cloning the Repository

```bash
git clone https://github.com/yourusername/performance-monitoring-system.git
cd performance-monitoring-system
```

### Environment Variables

Create a `.env` file in the root directory of the project based on `.env.example`.

```
# .env
# Database Configuration
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=perfmon_db
DB_HOST=db
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=8080
JWT_SECRET=super_secret_jwt_key_please_change_this_in_production!
CACHE_TTL_SECONDS=30 # Cache Time-To-Live for application list, in seconds

# Frontend Configuration
REACT_APP_API_BASE_URL=/api # Nginx will proxy /api to the backend
```

### Building and Running with Docker Compose

This is the recommended way to run the application in development and production.

```bash
docker compose build
docker compose up -d
```

This command will:
1.  Build the `backend` Docker image (C++ application).
2.  Build the `frontend` Docker image (React application).
3.  Start the `db` (PostgreSQL), `backend`, `frontend`, and `nginx` containers.
4.  Run database migrations and seed data in the `db` container.

### Accessing the Application

Once all services are up, the frontend will be accessible via Nginx:

*   **Frontend:** `http://localhost:80`
*   **Backend API (internal):** `http://localhost:8080` (only via Nginx proxy `/api`)

### Running without Docker (Development)

This section details how to run components individually for development purposes.

#### Backend (C++)

1.  **Install `vcpkg`:**
    ```bash
    git clone https://github.com/microsoft/vcpkg.git
    cd vcpkg
    ./bootstrap-vcpkg.sh
    export VCPKG_ROOT=$PWD # Add to your shell profile
    export PATH="$VCPKG_ROOT:$PATH" # Add to your shell profile
    cd ..
    ```
2.  **Install Dependencies:**
    ```bash
    vcpkg install cpp-httplib nlohmann-json pqxx spdlog boost-system boost-date-time --triplet=x64-linux # Adjust triplet for your OS
    ```
3.  **Build and Run:**
    ```bash
    cd backend
    mkdir build && cd build
    cmake -DCMAKE_TOOLCHAIN_FILE=${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake ..
    cmake --build .
    ./perfmon_backend # After setting .env variables in your shell or loading them
    ```
    Ensure a PostgreSQL database is running and accessible (e.g., via `docker compose up -d db` from root).

#### Frontend (React)

1.  **Install Node.js dependencies:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The frontend will typically run on `http://localhost:5173` (or similar). You'll need the backend API running for it to function correctly. If running backend directly, adjust `REACT_APP_API_BASE_URL` in `frontend/.env` to `http://localhost:8080/api`.

## Database

### Schema

The PostgreSQL database contains the following tables:

*   `users`: Stores user authentication information.
*   `applications`: Stores information about monitored applications.
*   `metric_definitions`: Defines the types of metrics for each application (e.g., `cpu_utilization`, `request_latency`).
*   `metric_data`: Stores the actual time-series metric values.

**Table `users`**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Table `applications`**
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_applications_user_id ON applications(user_id);
```

**Table `metric_definitions`**
```sql
CREATE TABLE metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'cpu_utilization', 'memory_usage_mb', 'request_latency_ms'
    unit VARCHAR(50),           -- e.g., '%', 'MB', 'ms'
    type VARCHAR(50) NOT NULL,  -- e.g., 'gauge', 'counter', 'histogram'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, name)
);
CREATE INDEX idx_metric_definitions_app_id ON metric_definitions(app_id);
```

**Table `metric_data`**
```sql
CREATE TABLE metric_data (
    id BIGSERIAL PRIMARY KEY,
    definition_id UUID NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    value DOUBLE PRECISION NOT NULL
);
CREATE INDEX idx_metric_data_definition_id_timestamp ON metric_data(definition_id, timestamp DESC);
-- Consider time-series partitioning or a dedicated TSDB for very high volume.
```

### Migrations

The `database/migrations` directory contains SQL scripts for schema changes. The `init_db.sh` script applies these migrations when the `db` service starts via Docker Compose.

### Seed Data

The `V2__seed_data.sql` script provides initial data, including a default user and a sample application with metric definitions.

## API Documentation

The C++ backend provides a RESTful API. All API endpoints require a valid JWT in the `Authorization: Bearer <token>` header, except for `/auth/register` and `/auth/login`.

**Base URL:** `/api` (when accessed via Nginx)

### Authentication

*   **`POST /auth/register`**
    *   **Description:** Registers a new user.
    *   **Request Body:** `{"username": "string", "email": "string", "password": "string"}`
    *   **Response:** `{"message": "User registered successfully"}` or `{"error": "string"}`
*   **`POST /auth/login`**
    *   **Description:** Logs in a user and returns a JWT.
    *   **Request Body:** `{"username": "string", "password": "string"}`
    *   **Response:** `{"token": "jwt_token_string"}` or `{"error": "string"}`

### User Management

*   **`GET /users/me`**
    *   **Description:** Retrieves the current authenticated user's profile.
    *   **Response:** `{"id": "uuid", "username": "string", "email": "string", ...}`
*   **`PUT /users/me`**
    *   **Description:** Updates the current authenticated user's profile.
    *   **Request Body:** `{"username": "string", "email": "string"}` (optional fields)
    *   **Response:** `{"message": "User profile updated", "user": {...}}`

### Application Management

*   **`GET /applications`**
    *   **Description:** Retrieves all applications owned by the authenticated user.
    *   **Response:** `[{"id": "uuid", "name": "string", "description": "string", ...}]`
*   **`POST /applications`**
    *   **Description:** Creates a new application.
    *   **Request Body:** `{"name": "string", "description": "string"}`
    *   **Response:** `{"message": "Application created", "application": {...}}`
*   **`GET /applications/:id`**
    *   **Description:** Retrieves details for a specific application.
    *   **Response:** `{"id": "uuid", "name": "string", "description": "string", ...}`
*   **`PUT /applications/:id`**
    *   **Description:** Updates an existing application.
    *   **Request Body:** `{"name": "string", "description": "string"}` (optional fields)
    *   **Response:** `{"message": "Application updated", "application": {...}}`
*   **`DELETE /applications/:id`**
    *   **Description:** Deletes an application and all associated metrics.
    *   **Response:** `{"message": "Application deleted"}`

### Metric Definitions

*   **`GET /applications/:appId/metric-definitions`**
    *   **Description:** Retrieves all metric definitions for a given application.
    *   **Response:** `[{"id": "uuid", "app_id": "uuid", "name": "string", "unit": "string", "type": "string", ...}]`
*   **`POST /applications/:appId/metric-definitions`**
    *   **Description:** Creates a new metric definition for an application.
    *   **Request Body:** `{"name": "string", "unit": "string", "type": "gauge|counter|histogram"}`
    *   **Response:** `{"message": "Metric definition created", "metric_definition": {...}}`

### Metric Data Ingestion

*   **`POST /metrics/data`**
    *   **Description:** Ingests new metric data points. This endpoint is designed for high-frequency data submission from monitoring agents. Requires an API key (or similar) or can rely on app-specific JWT. For simplicity, this example re-uses the user JWT for now.
    *   **Request Body:**
        ```json
        {
            "app_id": "uuid",
            "metrics": [
                {"name": "cpu_utilization", "value": 75.5, "timestamp": "ISO_STRING_OPTIONAL"},
                {"name": "memory_usage_mb", "value": 1024.0},
                {"name": "request_latency_ms", "value": 250.3}
            ]
        }
        ```
        `timestamp` is optional; if omitted, `CURRENT_TIMESTAMP` is used.
    *   **Response:** `{"message": "Metrics ingested successfully"}` or `{"error": "string"}`

### Metric Data Retrieval

*   **`GET /applications/:appId/metrics/:metricName/data`**
    *   **Description:** Retrieves historical metric data for a specific metric of an application.
    *   **Query Parameters:**
        *   `start`: ISO timestamp (e.g., `2023-01-01T00:00:00Z`) - required
        *   `end`: ISO timestamp - required
        *   `interval`: (optional) e.g., `1m`, `5m`, `1h` for aggregation. Defaults to raw data.
    *   **Response:** `[{"timestamp": "ISO_STRING", "value": 123.45}]` (aggregated or raw)

## Testing

### Unit Tests (C++)

Located in `backend/tests/unit`. Built with Google Test. These focus on isolated components like utility functions, data model serialization, and specific business logic helper functions.
To run:
```bash
cd backend/build
./run_unit_tests # Assuming the target name from CMake
```

### Integration Tests (C++)

Located in `backend/tests/integration`. Also built with Google Test. These test the interaction between components, especially the database layer and services. They require a running PostgreSQL instance (e.g., from `docker compose up -d db`).
To run:
```bash
cd backend/build
./run_integration_tests # Assuming the target name from CMake
```

### API Tests

API tests can be performed using tools like `curl`, Postman, or k6.
Examples using `curl`:

**Register User:**
```bash
curl -X POST http://localhost:80/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

**Login User:**
```bash
TOKEN=$(curl -X POST http://localhost:80/api/auth/login \
             -H "Content-Type: application/json" \
             -d '{"username": "testuser", "password": "password123"}' | jq -r .token)
echo "JWT Token: $TOKEN"
```

**Create Application:**
```bash
curl -X POST http://localhost:80/api/applications \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"name": "My Backend Service", "description": "Monitors our main API service"}'
```

**Ingest Metrics (replace APP_ID with an actual application ID):**
```bash
APP_ID="<your_app_id_here>" # Get this from the previous create app response or /applications
METRIC_DEF_ID="<your_metric_def_id_here>" # Get this from /applications/:appId/metric-definitions

curl -X POST http://localhost:80/api/metrics/data \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
           "app_id": "'"$APP_ID"'",
           "metrics": [
             {"name": "cpu_utilization", "value": 65.2},
             {"name": "memory_usage_mb", "value": 1200.5}
           ]
         }'
```

### Performance Tests

Located in `tests/performance`. These scripts are designed for `k6` to simulate load on the API endpoints.

To run:
1.  Install `k6` ([https://k6.io/docs/getting-started/installation/](https://k6.io/docs/getting-started/installation/))
2.  Run tests:
    ```bash
    k6 run tests/performance/load_test_metrics_ingestion.js
    ```

## CI/CD

A basic CI/CD pipeline is configured using GitHub Actions (`.github/workflows/ci-cd.yml`).
It performs the following steps on pushes to `main` and pull requests:

1.  **Backend Build & Test:** Builds the C++ backend and runs unit/integration tests.
2.  **Frontend Build:** Builds the React frontend.
3.  **Docker Image Build & Push (on `main` branch):** Builds and pushes Docker images for the backend and frontend to a container registry (e.g., GitHub Container Registry).

## Future Enhancements

*   **Advanced Metric Aggregation:** More sophisticated time-series data aggregation and downsampling.
*   **Alerting System:** Configure thresholds for metrics and send notifications (email, Slack).
*   **Dashboard Customization:** Allow users to create and customize their own dashboards.
*   **Multi-tenancy:** Enhance user isolation and resource management.
*   **Time-series Database Integration:** Integrate with dedicated TSDBs (e.g., InfluxDB, TimescaleDB) for massive scale.
*   **Distributed Tracing:** Integration with OpenTelemetry or similar for tracing requests across services.
*   **Health Checks:** More robust health checks for services.
*   **API Key Management:** Dedicated API keys for metric ingestion, separate from user JWTs.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---