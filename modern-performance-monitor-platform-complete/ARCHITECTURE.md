```markdown
# PerfoMetrics: Architecture Overview

This document outlines the high-level architecture of the PerfoMetrics system, detailing its components, their interactions, and the underlying design principles.

## 1. High-Level Design

PerfoMetrics is designed as a distributed, full-stack application leveraging a modular approach. It separates concerns into distinct services (backend, frontend, database, proxy) that communicate via well-defined interfaces (HTTP APIs, database connections).

![PerfoMetrics Architecture Diagram](architecture_diagram.png) <!-- Placeholder for a visual diagram -->
*(Imagine a diagram with Frontend (React) -> Nginx -> Backend (C++) -> PostgreSQL, with monitored services sending data to Nginx -> Backend)*

**Key Principles:**
*   **Scalability:** Components can be scaled independently (e.g., multiple backend instances).
*   **Performance:** The C++ backend is chosen for high-throughput metric ingestion and efficient data processing.
*   **Reliability:** Dockerization and container orchestration provide resilience.
*   **Security:** Authentication (JWT), authorization (RBAC), and API keys secure access.
*   **Observability:** Comprehensive logging for debugging and operational insights.
*   **Maintainability:** Clear code separation, consistent patterns, and documentation.

## 2. Core Components

### 2.1. Frontend (`perfo-metrics-frontend`)

*   **Technology:** React.js with TypeScript
*   **Purpose:** Provides the interactive user interface.
*   **Responsibilities:**
    *   **Dashboard:** Displays visualized performance metrics (charts, graphs).
    *   **Service Management UI:** Allows users to view and manage registered services.
    *   **Alert Configuration UI:** Interface for defining and managing alert rules.
    *   **User Authentication UI:** Login/Logout flows.
    *   **API Interaction:** Communicates with the C++ backend via RESTful APIs using `axios`.
*   **Styling:** Utilizes modern CSS practices.
*   **State Management:** Leverages React Context API for global state like authentication.

### 2.2. Backend (`perfo-metrics-backend`)

*   **Technology:** C++17, Crow Web Framework
*   **Purpose:** The high-performance core of the system, handling business logic and data persistence.
*   **Key Modules/Services:**
    *   **`Server`:** Initializes the Crow application, defines API routes, and manages global middleware.
    *   **`AuthService`:** Handles user authentication (login, JWT generation, token validation) and password hashing.
    *   **`MetricService`:** Manages metric ingestion from monitored services, validation of metric types, and querying historical metric data. Generates unique API keys for services.
    *   **`AlertingService` (Planned):** Manages alert rule creation, evaluation, and notification triggering.
    *   **`DBManager`:** Singleton responsible for managing PostgreSQL connections (using `libpqxx`) and providing a connection pool (conceptual, `libpqxx` manages per-thread connections).
    *   **`Logger`:** Centralized logging utility using `spdlog` for structured, configurable logging.
    *   **`Config`:** Utility for loading environment-specific configurations from `.env` files or environment variables.
*   **Middleware:**
    *   **`AuthMiddleware`:** Intercepts requests, validates JWTs, and attaches authenticated user context to the request.
    *   **`RateLimitMiddleware`:** Controls the rate of incoming requests (especially for metric ingestion) based on IP address.
    *   **Error Handling:** Custom exception handling (`AppException`) maps application errors to appropriate HTTP status codes and error messages.
*   **Data Models (`models/`):** C++ structures representing database entities (User, Service, Metric, AlertRule, ActiveAlert).
*   **Data Transfer Objects (`dto/`):** C++ structures for API request and response payloads, integrated with `nlohmann/json` for serialization/deserialization.

### 2.3. Database (`perfo-metrics-db`)

*   **Technology:** PostgreSQL 13+
*   **Purpose:** Persistent storage for all system data.
*   **Schema Design:**
    *   `users`: Stores user credentials (hashed passwords) and roles for authentication and authorization.
    *   `services`: Stores details of monitored applications, including unique `api_key`s for metric ingestion.
    *   `metrics`: The core time-series table for performance data. Optimized with indexes on `service_id`, `timestamp`, `metric_type`, and a GIN index on `tags` (JSONB) for efficient querying.
    *   `alert_rules`: Stores definitions of performance-based alert conditions.
    *   `active_alerts`: Records triggered and resolved alerts.
*   **Query Optimization:** Strategic indexing for common query patterns (e.g., retrieving metrics for a service within a time range). JSONB for `tags` allows flexible, schemaless metadata.
*   **Migrations:** SQL scripts managed (conceptually) by a migration tool to ensure schema evolution.

### 2.4. Reverse Proxy (`nginx`)

*   **Technology:** Nginx
*   **Purpose:** Acts as the entry point for all client traffic.
*   **Responsibilities:**
    *   **Load Balancing (future):** Distribute traffic across multiple backend instances.
    *   **Static File Serving:** Serves the React frontend's static assets.
    *   **API Gateway:** Routes API requests (`/api/`) to the C++ backend service.
    *   **CORS Handling:** Manages Cross-Origin Resource Sharing headers.
    *   **SSL Termination (production):** Handles HTTPS connections (not explicitly configured in development `docker-compose.yml`, but essential for production).
    *   **Request Buffering/Logging:** Can perform request buffering and detailed access logging.

## 3. Data Flow

1.  **Metric Ingestion:** Monitored application sends `POST /metrics` requests to Nginx (which forwards to C++ backend). The request includes the `X-API-KEY` for service identification and metric data.
2.  **User Interaction:** User opens browser -> Nginx serves React frontend. Frontend sends `POST /auth/login` to Nginx -> C++ backend.
3.  **Authentication:** C++ backend authenticates user against PostgreSQL, generates JWT, and returns it to the frontend.
4.  **Protected API Access:** Frontend includes JWT in `Authorization: Bearer <token>` header for subsequent requests to Nginx -> C++ backend.
5.  **Data Retrieval:** C++ backend receives requests, validates JWT, performs business logic, queries PostgreSQL, and returns data to the frontend for display.

## 4. Deployment and Operations

*   **Containerization:** All components are containerized using Docker, enabling consistent environments from development to production.
*   **Orchestration:** `docker-compose.yml` orchestrates the local development environment. For production, Kubernetes or similar would manage scaling and resilience.
*   **CI/CD:** GitHub Actions automates building, testing, and deployment processes, ensuring code quality and rapid releases.
*   **Monitoring:** The system itself is a performance monitor, but its own health and performance would be monitored by external tools (e.g., Prometheus/Grafana for C++ backend metrics, CloudWatch for Docker containers).
*   **Logging:** Centralized logs from all services facilitate debugging and auditing.

## 5. Scalability Considerations

*   **Backend:** The C++ backend is designed for high performance. For extreme loads, multiple instances can be run behind Nginx (or a load balancer). `Crow` supports multithreading.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding, or specialized time-series extensions like TimescaleDB for the `metrics` table).
*   **Frontend:** Purely client-side, scales with users' browsers. Nginx can scale to handle many static file requests.
*   **Metric Ingestion:** The rate limiting middleware helps protect the backend. Batch ingestion further optimizes network usage and database writes.

This architecture provides a solid foundation for a robust and scalable performance monitoring system.
```