# 📐 DataViz Pro: Architecture Documentation

This document describes the high-level architecture, component breakdown, and design principles of the DataViz Pro system.

## 1. High-Level Overview

DataViz Pro is a full-stack web application designed for interactive data visualization. It follows a decoupled, service-oriented architecture, leveraging a performant C++ backend for data processing and API serving, and a modern JavaScript frontend for a rich user experience. Docker is used for containerization, enabling consistent development, testing, and deployment.

```mermaid
graph TD
    A[User Browser/Client] -->|HTTP/HTTPS| B[Frontend App (React/TS)]
    B -->|REST API (JSON)| C[C++ Backend API Gateway]
    C -->|Internal API Calls / Business Logic| D[C++ Backend Services]
    D -->|PostgreSQL Protocol (libpqxx)| E[PostgreSQL Database]
    D -- (Filesystem) --> F[Data Storage (Uploaded Files)]

    subgraph C++ Backend
        C -- Auth, Rate Limiting, Error Handling --> D
        D -- DAL --> E
        D -- Data Processing --> F
    end

    subgraph Infrastructure
        E -- Docker Volume --> E_Data[Persistent DB Data]
        F -- Docker Volume --> F_Data[Persistent File Data]
        G[CI/CD Pipeline (GitHub Actions)] -- Builds & Tests --> H[Docker Images]
        H -- Deployment --> K[Production Servers]
    end
```

## 2. Component Breakdown

### 2.1. Frontend Application (React/TypeScript)

*   **Technology:** React, TypeScript, Redux Toolkit, React Router, D3.js/Chart.js/Plotly.js for visualizations, Material-UI/Ant Design for UI components.
*   **Purpose:** Provides the user interface for all interactions, including:
    *   User authentication (Login, Register).
    *   Dashboard creation, editing, and viewing.
    *   Dataset upload and management.
    *   Interactive data visualizations.
    *   Client-side routing and state management.
*   **Communication:** Interacts with the C++ Backend exclusively via RESTful API calls.

### 2.2. C++ Backend (Core Application)

The backend is developed in C++ for maximum performance, especially crucial for data-intensive operations.

*   **Technology:** C++17/20, Crow (web framework), `libpqxx` (PostgreSQL client), `nlohmann/json` (JSON handling), `spdlog` (logging), OpenSSL (for JWT).
*   **Modules:**
    *   **API Gateway:** Handles incoming HTTP requests, routes them to appropriate handlers, and applies global middleware (Auth, Rate Limiting).
    *   **Authentication & Authorization (`auth/`):**
        *   Manages user registration and login.
        *   Generates and verifies JSON Web Tokens (JWT) for secure session management.
        *   Auth middleware enforces access control on protected routes.
    *   **Data Access Layer (DAL - `db/`):**
        *   Abstraction layer for interacting with PostgreSQL.
        *   Manages database connections (`libpqxx`).
        *   Executes SQL queries (defined in `SQLQueries.h`).
        *   Handles database transactions and error mapping.
    *   **Business Logic / Services (`services/`):**
        *   **`DatasetService`:** Manages CRUD operations for datasets, including file storage, schema inference, and data sampling.
        *   **`DataProcessingService`:** Handles tasks like parsing uploaded files (CSV, JSON), inferring data types/schemas, and providing sampled data.
        *   **`DashboardService` (Implicit via Handler):** Manages CRUD operations for dashboard metadata and configuration.
        *   **`UserService` (Implicit via Handler):** Manages user profile information.
    *   **Handlers (`handlers/`):** Specific C++ classes that define API routes and logic for each resource (User, Dataset, Dashboard). They coordinate between middleware, services, and the DAL.
    *   **Models (`models/`):** C++ structs representing database entities (User, Dataset, Dashboard).
    *   **Utilities (`utils/`):**
        *   **`Logger`:** Configures structured logging using `spdlog`.
        *   **`JWTUtils`:** Helper functions for JWT token generation and verification.
        *   **`Cache`:** In-memory LRU cache for frequently accessed data (e.g., dashboard configurations, small dataset metadata).
        *   **`RateLimiter`:** Controls API request frequency per client to prevent abuse.
    *   **Middleware (`middleware/`):** Intercepts requests/responses for common concerns like authentication, error handling, and logging.
    *   **Configuration (`config/`):** Manages application settings loaded from environment variables.
*   **Data Processing:** The C++ backend is ideal for processing large datasets efficiently before sending aggregated or sampled data to the frontend for visualization.

### 2.3. PostgreSQL Database

*   **Technology:** PostgreSQL 14+
*   **Purpose:** Persistent storage for:
    *   User accounts and authentication hashes.
    *   Dataset metadata (name, description, schema, file path).
    *   Dashboard configurations (layout, widget types, linked datasets).
    *   Migration history.
*   **Design:**
    *   **Schema:** Defined in `database/schema.sql` with relationships, constraints, and indexes.
    *   **Migrations:** Managed by the C++ backend on startup to ensure schema consistency (`DBManager::runMigrations`).
    *   **Data Types:** Utilizes `UUID` for primary keys and foreign keys, `JSONB` for flexible schema and configuration storage.
    *   **Query Optimization:** Indexes are applied to frequently queried columns.

### 2.4. Data Storage

*   **Mechanism:** For simplicity, uploaded dataset files (e.g., CSV, JSON) are stored on the local filesystem within a `data_storage` directory. This directory is mounted as a Docker volume for persistence.
*   **Scalability Note:** For extremely large-scale production, this would be replaced by object storage solutions like AWS S3, Google Cloud Storage, or Azure Blob Storage.

### 2.5. Containerization (Docker)

*   **Technology:** Docker, Docker Compose.
*   **Purpose:** Encapsulates the application and its dependencies into isolated containers for:
    *   **Consistency:** "Works on my machine" becomes "works everywhere."
    *   **Isolation:** Prevents conflicts between services and host environment.
    *   **Portability:** Easy deployment across different environments (dev, staging, prod).
    *   **Scalability:** Allows horizontal scaling of stateless services (backend, frontend).
*   **Configuration:** `docker-compose.yml` orchestrates the `db`, `backend`, and `frontend` services.

### 2.6. CI/CD Pipeline (GitHub Actions)

*   **Technology:** GitHub Actions.
*   **Purpose:** Automates the software delivery process to ensure code quality and efficient deployment.
*   **Stages:**
    *   **Build & Test Backend:**
        *   Builds the C++ Docker image.
        *   Starts a temporary PostgreSQL container.
        *   Runs C++ unit and integration tests.
        *   Performs basic API integration tests against the running backend.
    *   **Build & Test Frontend:**
        *   Sets up Node.js environment.
        *   Installs dependencies.
        *   Runs React/TypeScript unit tests.
    *   **Deploy (to Production):**
        *   Triggered on `push` to `main` branch after successful tests.
        *   Builds and pushes production-ready Docker images to a container registry (e.g., Docker Hub).
        *   Uses SSH to connect to the deployment server and pulls/updates the Docker Compose services.

## 3. Design Principles

*   **Modularity:** Code is organized into logical units (handlers, services, models, utilities) to promote separation of concerns and maintainability.
*   **API-First:** The backend provides a well-defined RESTful API, allowing flexible integration with any frontend or other services.
*   **Security:**
    *   JWT for stateless authentication.
    *   Secure password hashing (conceptual).
    *   Parameterized queries to prevent SQL injection.
    *   Environment variables for sensitive configurations.
*   **Error Handling:** Consistent `DataVizError` exception hierarchy for predictable API error responses, caught by middleware.
*   **Observability:** Integrated logging with configurable levels and output destinations (`spdlog`).
*   **Scalability:** Stateless backend services (apart from file storage) allow for easy horizontal scaling. Database and file storage are externalized.
*   **Performance:** C++ for computationally intensive backend tasks.
*   **Developer Experience:** Dockerized environment ensures quick setup and consistent behavior across development teams.
```