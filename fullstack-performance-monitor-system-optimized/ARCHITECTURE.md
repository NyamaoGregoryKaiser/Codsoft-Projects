```markdown
# Architecture Documentation: Performance Monitoring System

## 1. Overview

The Performance Monitoring System is a full-stack web application designed to collect, store, visualize, and alert on performance metrics from various client applications. It follows a modular, layered architecture to ensure scalability, maintainability, and enterprise-grade reliability.

### Core Principles

*   **Modularity**: Separation of concerns into distinct services and components.
*   **Scalability**: Designed to handle increasing data volume and user load.
*   **Reliability**: Robust error handling, logging, and data persistence.
*   **Security**: Authentication, authorization, and API key protection.
*   **Observability**: Comprehensive logging and monitoring capabilities.

## 2. High-Level Architecture

The system comprises three main layers:

1.  **Client Application (Monitored App)**: External applications (e.g., web servers, microservices) that integrate a conceptual "SDK" to send performance metrics to the monitoring system.
2.  **Backend (Node.js/Express.js)**: The core API server responsible for metric ingestion, data storage, user management, application management, and alert processing.
3.  **Frontend (React.js)**: The user interface for interacting with the system, including dashboards, application details, and alert configuration.
4.  **Database (PostgreSQL)**: The primary data store for all system data, including users, applications, metrics, and alerts.
5.  **Caching (Redis - Optional)**: An in-memory data store used for caching frequently accessed data or session management to improve performance.

```mermaid
graph TD
    subgraph Client Application (Monitored Service)
        A[App SDK] -->|Send Metrics| B(Backend API: /metrics/collect)
    end

    subgraph User Interaction
        C[Web Browser / User] -->|HTTP Requests| D(Frontend: React.js)
    end

    subgraph Performance Monitoring System
        D -->|HTTP API Calls| B

        subgraph Backend (Node.js/Express.js)
            B -- Authentication --> E(Auth Middleware)
            E -- Authorization --> F(Authorization Middleware)
            F -- Rate Limiting --> G(Rate Limit Middleware)
            G -- Logging --> H(Logging Middleware)
            H -- Error Handling --> I(Error Handler Middleware)

            I -- Controllers --> J(Services: Business Logic)
            J -- Models (Sequelize) --> K(PostgreSQL Database)
            J -- Caching --> L(Redis Cache)
            J -- Alerting Logic --> M(Notification Service - Conceptual)
        end
    end

    K -- Data Persistence --> N[Persistent Storage]
    L -- In-memory Cache --> O[Fast Data Access]
    M --> P[Email / SMS / Slack]
```

## 3. Detailed Component Breakdown

### 3.1. Frontend (React.js)

*   **Purpose**: Provides an intuitive user interface for managing monitored applications, viewing performance metrics, and configuring alerts.
*   **Key Technologies**: React.js, React Router, Axios, Recharts (for data visualization), Context API (for authentication state), React Toastify (for notifications).
*   **Modules/Pages**:
    *   `AuthForm.js`, `LoginPage.js`, `RegisterPage.js`: User authentication and registration.
    *   `Dashboard.js`: Overview of all monitored applications.
    *   `AppDetail.js`: Detailed view of a single application, including metric charts and alert management.
    *   `MetricChart.js`, `AppCard.js`, `AddApplicationForm.js`: Reusable UI components.
*   **Data Flow**: Makes API calls to the backend via `axios` instance configured with interceptors for JWT token attachment and global error handling.
*   **State Management**: Primarily `useState` and `useEffect` hooks for local component state, `AuthContext` for global authentication state.

### 3.2. Backend (Node.js/Express.js)

*   **Purpose**: Serves as the central API gateway, handling all business logic, data interactions, and integrations.
*   **Key Technologies**: Node.js, Express.js, Sequelize ORM, PostgreSQL, JWT, Bcrypt.js, Winston (logging), Express-rate-limit, Redis (optional caching).
*   **Layered Structure**:
    *   **Routes**: Defines API endpoints (`/api/auth`, `/api/applications`, `/api/metrics`, `/api/users`).
    *   **Middleware**:
        *   `loggingMiddleware`: Logs all incoming requests and responses.
        *   `errorHandler`: Centralized error handling to catch exceptions and send consistent error responses.
        *   `authMiddleware`: Handles JWT-based authentication (`authenticateToken`) and authorization (`authorizeApplicationOwner`, `authenticateApiKey`).
        *   `rateLimitMiddleware`: Protects endpoints from abuse.
        *   `helmet`, `cors`: Security and Cross-Origin Resource Sharing.
    *   **Controllers**: Act as the entry point for API requests, parsing input, calling service methods, and formatting responses.
    *   **Services**: Encapsulate the core business logic. They interact with models and external services (e.g., Redis, alert notifications). This layer contains no direct Express `req`/`res` objects.
        *   `authService`: User registration and login.
        *   `userService`: User profile management.
        *   `applicationService`: CRUD operations for monitored applications.
        *   `metricService`: Metric ingestion, retrieval, aggregation, and alert processing.
    *   **Models (Sequelize)**: Define the database schema and provide an ORM interface for interacting with PostgreSQL. Includes hooks for password hashing.
    *   **Utils**: Contains helper functions like `logger`, `jwt` token utilities, and `redisClient`.
*   **Data Flow**:
    1.  Request arrives at `app.js`.
    2.  Passes through global middleware (Helmet, CORS, Logging, Rate Limiting, JSON parsing).
    3.  Route matching (e.g., `applicationRoutes`).
    4.  Route-specific middleware (Authentication, Authorization).
    5.  Controller method is executed, calling appropriate Service methods.
    6.  Service methods interact with Sequelize Models (for PostgreSQL) or `redisClient` (for Redis).
    7.  Data is processed, and a response is sent back through the middleware chain (including error handling if needed).
*   **Alerting Logic**: `metricService` includes `checkAndTriggerAlerts` which is called asynchronously after a new metric is collected. This function retrieves active alerts, evaluates the metric against thresholds, and updates the alert status if triggered. In a production system, it would also invoke an external notification service.
*   **Caching**: `redisClient` is provided for caching. A common use case would be caching aggregated metric data for popular dashboards or frequently accessed application details. This is implemented conceptually in `utils/redisClient.js`.

### 3.3. Database (PostgreSQL)

*   **Purpose**: Persistent storage for all application data.
*   **Schema**:
    *   `Users`: Stores user credentials and profile information.
    *   `Applications`: Stores details of applications being monitored, linked to `Users` via `userId`. Includes `apiKey` for metric ingestion.
    *   `Metrics`: Stores raw performance data points (CPU, Memory, Request Latency, Error Rate), linked to `Applications`. This table is designed for high-volume writes.
    *   `Alerts`: Stores configured alerts, linked to `Applications`.
*   **ORM**: Sequelize is used to interact with PostgreSQL, providing an abstraction layer and managing schema definitions, migrations, and relationships.
*   **Query Optimization**: Indexes are defined on `applicationId` and `timestamp` in the `metrics` table to optimize data retrieval for charting. For very high-volume metric data, partitioning and/or a dedicated time-series database (e.g., TimescaleDB, InfluxDB) would be considered.

### 3.4. Caching Layer (Redis)

*   **Purpose**: Improves response times by storing frequently accessed or computationally expensive data in memory.
*   **Implementation**: `utils/redisClient.js` provides a wrapper around the `redis` npm package.
*   **Potential Use Cases**:
    *   Caching aggregated metric data for various time periods (e.g., "last 24h CPU average for App X").
    *   Session management (if JWT was stored server-side, though it's client-side here).
    *   Rate limiter storage (if `express-rate-limit` was configured to use Redis store).

## 4. Data Flow and Interactions

1.  **User Registration/Login**: Frontend sends credentials to `POST /api/auth/register` or `POST /api/auth/login`. Backend authenticates, issues a JWT, and sends it back. Frontend stores JWT and user data locally.
2.  **Application Management**: Authenticated users send `POST /api/applications` to create, `GET /api/applications` to list, `GET /api/applications/:appId` to view, `PATCH /api/applications/:appId` to update, and `DELETE /api/applications/:appId` to delete applications. Authorization ensures users only interact with their own applications.
3.  **Metric Ingestion**: The monitored client application sends performance data (e.g., `{"type": "cpu", "value": 0.75}`) to `POST /api/metrics/collect` with its unique `X-API-Key` header. The backend validates the API key, stores the metric, and asynchronously triggers alert checks.
4.  **Metric Visualization**: Frontend requests historical metrics from `GET /api/metrics/:appId/data/:metricType?period=...`. Backend retrieves data, potentially aggregates it, and sends it back for charting.
5.  **Alert Management**: Frontend retrieves alerts from `GET /api/metrics/:appId/alerts`, creates new ones via `POST /api/metrics/:appId/alerts`, and updates/deletes specific alerts via `PATCH/DELETE /api/metrics/alerts/:alertId`.

## 5. Security Considerations

*   **Authentication**: JWT (JSON Web Tokens) for stateless authentication.
*   **Authorization**: Middleware (`authorizeApplicationOwner`, `authenticateApiKey`) ensures users/apps only access authorized resources.
*   **Password Hashing**: `bcrypt.js` is used for securely hashing user passwords.
*   **Rate Limiting**: `express-rate-limit` prevents brute-force attacks and API abuse.
*   **CORS**: Configured to restrict access to the frontend origin.
*   **Helmet**: A collection of middlewares to enhance API security (e.g., XSS, clickjacking protection).
*   **API Keys**: UUID-based API keys are generated for applications to authenticate metric ingestion. These should be treated as sensitive credentials.

## 6. Observability

*   **Logging**: `Winston` is used for structured logging in the backend, supporting different log levels and output destinations (console, file).
*   **Error Handling**: Centralized error middleware ensures all errors are logged and handled gracefully, returning consistent responses to clients.
*   **Monitoring**: While no dedicated monitoring agent (like Prometheus/Grafana) is integrated, the logging provides a foundation. In a real production system, performance metrics of the monitoring system itself would also be collected and visualized.

## 7. Scalability Enhancements (Future Considerations)

*   **Metric Ingestion**:
    *   **Message Queue**: For very high-volume metric ingestion, introduce a message queue (e.g., Kafka, RabbitMQ) between the API gateway and the metric storage service to decouple producers and consumers and buffer spikes.
    *   **Time-Series Database**: Replace PostgreSQL for raw metrics storage with a specialized time-series database (e.g., TimescaleDB, InfluxDB, Prometheus) for better performance on writes and time-based queries.
*   **Data Aggregation**: Implement pre-aggregation jobs (e.g., daily, hourly averages) into separate summary tables or use continuous aggregates in TimescaleDB to speed up dashboard queries for longer time periods.
*   **Backend Scaling**: Deploy multiple instances of the Node.js backend behind a load balancer.
*   **Caching**: Implement more aggressive caching strategies using Redis for frequently accessed dashboards or aggregated data.
*   **Alerting**: Move alert evaluation to a separate, dedicated service that can process metrics streams efficiently (e.g., using a stream processing framework). Integrate with external notification services (e.g., PagerDuty, Slack, email, SMS).
*   **Frontend**: Implement server-side rendering (SSR) or static site generation (SSG) for improved initial load times and SEO if public visibility is a concern.

This architecture provides a solid foundation for a robust performance monitoring system, with clear pathways for future scaling and feature enhancements.
```