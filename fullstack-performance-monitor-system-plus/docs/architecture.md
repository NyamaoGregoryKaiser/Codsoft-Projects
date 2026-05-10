# AppInsight Architecture Documentation

## 1. Overview

AppInsight is a full-stack performance monitoring system designed to collect, store, and visualize performance metrics from web applications. It provides insights into application health, user experience (Core Web Vitals), and backend API performance. The system is built with a modular, scalable, and production-ready architecture.

## 2. High-Level Diagram

```mermaid
graph TD
    A[Monitored Application Frontend] -->|Send Metrics (JS SDK/API)| B(AppInsight Backend API)
    B --> C{API Gateway / Load Balancer}
    C --> B
    D[Monitored Application Backend] -->|Send Metrics (API)| B

    subgraph AppInsight Platform
        B(AppInsight Backend API) --> E[Redis Cache & Rate Limiter]
        B --> F[PostgreSQL Database]
        AppInsightFrontend(AppInsight Frontend) --> B
    end

    AppInsightFrontend --> G[Browser / User]
```

## 3. Component Breakdown

### 3.1. Frontend (React / TypeScript)

*   **Technology:** React, TypeScript, React Router DOM, Axios, React Query, Recharts, Tailwind CSS.
*   **Purpose:** Provides the user interface for AppInsight, allowing users to register, log in, manage their projects, and view detailed performance dashboards.
*   **Key Modules/Components:**
    *   **Pages:** `LoginPage`, `RegisterPage`, `DashboardPage`, `ProjectsPage`, `ProjectDetailPage`, `NewProjectPage`.
    *   **Components:** `Navbar`, `Sidebar` (Layout), `Card`, `Button`, `Input`, `LoadingSpinner`, `Toast`, `MetricOverviewCard`, `MetricChart`, `ProjectCard`.
    *   **Hooks:** `useAuth`, `useProjects`, `useMetrics` (for data fetching and state management).
    *   **Contexts:** `AuthContext` (for user authentication state), `ToastContext` (for global notifications).
    *   **API Client:** Centralized Axios instance with interceptors for JWT token attachment and global error handling.
*   **Data Flow:** Fetches data from the AppInsight Backend API using `React Query`, processes it, and renders visualizations using `Recharts`.
*   **Styling:** Utility-first CSS framework (Tailwind CSS) for responsive and consistent UI.

### 3.2. Backend (Node.js / Express.js / TypeScript)

*   **Technology:** Node.js, Express.js, TypeScript, Prisma (ORM), PostgreSQL, Redis, Winston (logging), JWT (authentication), bcrypt (password hashing), express-rate-limit, Helmet, CORS.
*   **Purpose:** Serves a RESTful API for client applications (frontend, monitored apps) to interact with. Handles user authentication, project management, metric ingestion, and metric retrieval/aggregation.
*   **Key Modules/Components:**
    *   **API Routes:** `/auth` (register, login), `/projects` (CRUD for projects), `/metrics` (ingestion, summary, timeline, errors).
    *   **Controllers:** Handle incoming requests, validate input, call services, and send responses.
    *   **Services:** Encapsulate business logic and interact with the database (via Prisma).
    *   **Middleware:**
        *   `auth`: `protect` (JWT verification), `authorizeProjectAccess` (ACL for projects), `validateApiKey` (for metric ingestion).
        *   `errorHandler`: Centralized error handling for consistent error responses.
        *   `requestLogger`: Logs incoming requests and their response times.
        *   `healthCheck`: Endpoint to monitor service health.
        *   `rateLimiter`: Protects API endpoints against abuse.
    *   **Database Client:** `Prisma` for PostgreSQL interactions.
    *   **Redis Client:** `ioredis` for cache and rate limiting.
    *   **Utilities:** `logger` (Winston for structured logging).
*   **Data Flow:**
    *   **Metric Ingestion:** Monitored apps send `POST /api/metrics/ingest` requests with API keys. Metrics are validated, processed, and stored in PostgreSQL.
    *   **User Operations:** Frontend sends authenticated requests (JWT) for user management and project management.
    *   **Metric Retrieval:** Frontend sends authenticated requests to retrieve aggregated metrics from PostgreSQL, utilizing Redis for caching.

### 3.3. Database (PostgreSQL)

*   **Technology:** PostgreSQL.
*   **Purpose:** Persistent storage for all application data.
*   **Schema:**
    *   `User`: Stores user credentials (`email`, `passwordHash`), `name`, and timestamps.
    *   `Project`: Stores project details (`name`, `apikey`), `ownerId`, and timestamps. Each project has a unique API key for metric ingestion.
    *   `Metric`: Stores individual performance observations (`projectId`, `timestamp`, `type`, `value`, `context`).
*   **Schema Design Considerations:**
    *   `MetricType` enum for classifying metrics (LCP, FID, CLS, API_RESPONSE, ERROR, CUSTOM).
    *   `context` field (JSONB) in `Metric` for flexible storage of additional details (e.g., URL, error message, component).
    *   Indexes on `projectId`, `timestamp`, `type`, and a composite index on `projectId`, `type`, `timestamp` for efficient time-series queries.
*   **Migrations:** Managed by Prisma CLI.
*   **Seed Data:** Populates the database with initial users, projects, and dummy metrics for demonstration.

### 3.4. Caching (Redis)

*   **Technology:** Redis.
*   **Purpose:**
    *   **Rate Limiting:** Stores request counts per IP address to enforce rate limits on API endpoints.
    *   **Metric Aggregates Caching:** Caches computed project summary metrics and timeline data to reduce database load and improve response times for frequently requested dashboards.
*   **Integration:** `ioredis` client used in backend services and `rate-limit-redis` for Express middleware.

## 4. Operational Aspects

### 4.1. Configuration

*   `.env` files for environment-specific variables (DB URLs, JWT secrets, ports, Redis URLs).
*   `dotenv` for loading environment variables.

### 4.2. Logging & Error Handling

*   **Logging:** `Winston` used in the backend for structured logging (console output in development, configurable for file/external services in production).
*   **Error Handling:**
    *   Custom `AppError` class for operational errors.
    *   Centralized `errorHandler` middleware in Express to catch all errors and send consistent JSON responses.
    *   Global handlers for `unhandledRejection` and `uncaughtException` to ensure graceful shutdown and logging.

### 4.3. Authentication & Authorization

*   **User Authentication:** JWT (JSON Web Tokens) for stateless authentication.
    *   User registers/logs in, receives a JWT.
    *   JWT is sent in `Authorization: Bearer <token>` header for protected routes.
*   **API Key Authentication:** A unique API key generated per project.
    *   Monitored applications send metrics with `X-AppInsight-Api-Key` header.
    *   `validateApiKey` middleware verifies the key against the database.
*   **Authorization:**
    *   `protect` middleware ensures a user is authenticated.
    *   `authorizeProjectAccess` middleware ensures the authenticated user is the owner of the requested project before allowing access to project-specific resources (CRUD, metric viewing).

## 5. Deployment

*   **Docker:** `Dockerfile` for backend and frontend. `docker-compose.yml` orchestrates PostgreSQL, Redis, backend, and frontend for local development and simplified production deployment.
*   **CI/CD:** `GitHub Actions` workflow for:
    *   Building backend and frontend.
    *   Running tests.
    *   (Conceptual) Deploying Docker images to a container registry and then to a server.

## 6. Testing Strategy

*   **Unit Tests:** Jest for isolated testing of functions, services, and small components.
    *   *Backend:* `auth.service.ts`, `project.service.ts`, utility functions.
    *   *Frontend:* Custom hooks (`useProjects`, `useMetrics`), small presentational components.
*   **Integration Tests:** Jest and Supertest for testing API endpoints, including database interactions, middleware, and route logic.
    *   *Backend:* Auth routes, project CRUD routes, metric ingestion/retrieval routes.
    *   *Frontend:* Components interacting with mocked API (`LoginPage`, `ProjectCard`).
*   **Performance Tests:** Jest with Supertest for basic load simulation on critical endpoints (e.g., `/api/metrics/ingest`) to measure average response times under synthetic load. For true load testing, specialized tools (k6, JMeter) are recommended.
*   **E2E Tests:** Cypress for simulating user flows in the browser (registration, login, project creation, viewing dashboards). Ensures the entire system integrates correctly from a user's perspective.

## 7. Future Enhancements

*   **Dedicated Time-Series Database:** Integrate InfluxDB or Prometheus for more efficient storage and querying of high-volume time-series metric data.
*   **Alerting System:** Allow users to set thresholds for metrics and receive notifications (email, Slack) when thresholds are breached.
*   **Background Processing:** Use a message queue (RabbitMQ, Kafka) and a worker service for asynchronous metric processing, error analysis, or long-running aggregations.
*   **Real User Monitoring (RUM) SDK:** Provide a client-side JavaScript SDK for easy integration into monitored frontends.
*   **Backend APM Agent:** Offer a library for Node.js/Python/Go applications to automatically collect backend metrics and errors.
*   **Advanced Analytics:** Machine learning for anomaly detection, trend prediction.
*   **Multi-Tenancy:** More robust isolation between user projects if multiple organizations are to be supported on the same instance.
*   **User Roles & Permissions:** Implement more granular access control (e.g., read-only users, collaborators).
*   **Admin Dashboard:** For managing users, global settings, system health.
*   **Theming:** Dark mode toggling.
```