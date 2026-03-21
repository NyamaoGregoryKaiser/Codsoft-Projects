```markdown
# VisuFlow Architecture Documentation

This document outlines the architectural design of the VisuFlow data visualization platform.

## 1. High-Level Overview

VisuFlow is a web-based, full-stack application built using a microservices-inspired architecture. It consists of three main services orchestrated by Docker Compose:

1.  **Frontend:** A single-page application (SPA) built with React and TypeScript, responsible for user interaction, dashboard rendering, and API communication.
2.  **Backend API:** A Python FastAPI application that provides a RESTful API for managing users, data sources, dashboards, and charts. It handles business logic, data processing requests, authentication, and authorization.
3.  **Database (PostgreSQL):** The primary data store for all application metadata (users, data source configurations, dashboard layouts, chart definitions).
4.  **Cache/Message Broker (Redis):** Used for caching query results, managing rate limits, and potentially for lightweight task queuing.

The application adheres to principles of scalability, security, and maintainability, utilizing containerization for consistent deployment across environments.

```
+------------------+     +--------------------+     +---------------+     +---------------+
|    User / Browser  | <-> |     Frontend (React)   | <-> |  Backend (FastAPI)  | <-> |    PostgreSQL   |
+------------------+     +--------------------+     +---------------+     +---------------+
                                   ^                           |                 |
                                   |                           |                 |
                                   +---------------------------+                 |
                                         REST API (HTTP/S)                     |
                                                                               |
                                   +-------------------------------------------+
                                         ORM (SQLAlchemy)
                                                                               |
                                   +-------------------------------------------+
                                         Cache/Rate Limit (Redis)
```

## 2. Backend Architecture (FastAPI)

The backend is built with FastAPI, leveraging its asynchronous capabilities for high performance.

### 2.1. Core Modules

*   **`main.py`**: The entry point of the FastAPI application. It initializes the app, registers routes, middleware, and handles application lifecycle events (startup/shutdown).
*   **`api/v1`**: Contains all REST API endpoints, grouped by resource (e.g., `auth.py`, `users.py`, `datasources.py`). Each file defines a `APIRouter` for its respective resource.
*   **`models`**: SQLAlchemy declarative models defining the database schema (e.g., `User`, `DataSource`, `Dashboard`, `Chart`).
*   **`schemas`**: Pydantic models used for request validation, response serialization, and data integrity checks. This clearly defines data contracts for the API.
*   **`crud`**: Implements Create, Read, Update, Delete (CRUD) operations for each model, abstracting database interactions from the API layer. A `CRUDBase` provides generic functionality.
*   **`services`**: Contains business logic that goes beyond simple CRUD, such as:
    *   **`data_processor.py`**: A critical service responsible for connecting to various external data sources (PostgreSQL, MySQL, API, S3, Google Sheets), executing queries, and returning processed data for visualization. This service also integrates with the caching layer.
*   **`core`**: Houses cross-cutting concerns and configurations:
    *   **`config.py`**: Manages application settings loaded from environment variables using Pydantic Settings.
    *   **`security.py`**: Handles JWT token generation/validation, password hashing (bcrypt), and other security-related utilities.
    *   **`logger.py`**: Configures structured (JSON) logging for consistent log aggregation and analysis.
    *   **`middlewares.py`**: Defines custom exception handlers (validation errors, HTTP errors, generic server errors) for robust error reporting.
    *   **`caching.py`**: Provides utilities for interacting with Redis for data caching, including a decorator for easy integration.
    *   **`rate_limiter.py`**: Implements a fixed-window rate-limiting mechanism using Redis to protect API endpoints from abuse.
*   **`db`**: Database setup:
    *   **`session.py`**: Configures SQLAlchemy engine and async session makers.
    *   **`base.py`**: Defines the `Base` class for SQLAlchemy models, including common fields like `id`, `created_at`, `updated_at`.
    *   **`init_db.py`**: Script for initial database table creation and seeding of default data (e.g., superuser).

### 2.2. Data Processing Workflow

1.  **Request:** Frontend requests data for a specific chart, passing `chart_id` and optional `query_params`.
2.  **API Endpoint:** The `charts.py` router receives the request and calls `DataProcessorService.get_chart_data()`.
3.  **Caching:** The `get_chart_data` method (decorated with `@cache_data`) first checks Redis for cached results based on `chart_id` and `query_params`.
    *   **Cache Hit:** If data is found, it's returned immediately.
    *   **Cache Miss:** If not found, it proceeds to fetch from the actual data source.
4.  **Data Source Interaction:** `DataProcessorService` identifies the data source type (e.g., PostgreSQL, API) associated with the chart and dispatches to the appropriate private method (`_query_relational_db`, `_query_api_source`, etc.).
5.  **Query Execution:** The service executes the configured query (SQL, API call) against the external data source.
6.  **Data Transformation:** Raw data is fetched and transformed into a consistent JSON format (`List[Dict[str, Any]]`).
7.  **Caching & Response:** The transformed data is stored in Redis (with a configurable TTL) and then returned to the frontend.

### 2.3. Authentication and Authorization

*   **JWT (JSON Web Tokens):** Used for stateless authentication.
*   **Login Flow:** Users provide credentials, the backend authenticates, and issues an access token.
*   **Protected Endpoints:** Most API endpoints require a valid JWT in the `Authorization: Bearer <token>` header.
*   **Dependency Injection:** FastAPI's `Depends` system is used to inject the `current_user` object into route functions, enabling easy access to user information and role-based checks (`get_current_active_user`, `get_current_active_superuser`).

## 3. Frontend Architecture (React)

The frontend is a modern React SPA, built with TypeScript for type safety and maintainability.

### 3.1. Core Components

*   **`main.tsx`**: Entry point of the React application.
*   **`App.tsx`**: Main application component, typically containing global layout and routing.
*   **`router.tsx`**: Defines application routes using React Router DOM.
*   **`pages`**: Top-level components representing distinct pages (e.g., `LoginPage`, `DashboardListPage`, `ChartBuilderPage`).
*   **`components`**: Reusable UI components, categorized by domain or common usage (e.g., `auth/LoginForm`, `charts/ChartRenderer`, `layout/Header`).
*   **`store`**: Redux Toolkit is used for global state management. It's structured with `slices` for different domains (e.g., `authSlice`, `dashboardSlice`).
*   **`api`**: Contains Axios-based client functions for interacting with the backend API.
*   **`services`**: Business logic specific to the frontend, particularly `dataVizService.ts` which orchestrates chart rendering using ECharts.
*   **`types`**: TypeScript interface definitions for API responses and application models.
*   **`hooks`**: Custom React hooks for encapsulating reusable logic (e.g., `useAuth`).
*   **`styles`**: Global stylesheets and utility styles (e.g., using CSS modules or Tailwind CSS, if adopted).

### 3.2. Data Flow (Frontend)

1.  **User Action:** User interacts with the UI (e.g., clicks "View Dashboard").
2.  **Redux Dispatch:** A Redux action is dispatched (e.g., `fetchDashboardById`).
3.  **API Call:** The Redux thunk (or RTK Query) calls the appropriate function in `frontend/src/api` (e.g., `dashboardsApi.getDashboard`).
4.  **Backend Request:** Axios sends an HTTP request to the FastAPI backend.
5.  **Backend Response:** Backend processes the request and returns data.
6.  **Redux Update:** Frontend receives data, Redux store is updated, and components re-render based on state changes.
7.  **Visualization:** For charts, `ChartRenderer` component receives data from the Redux store, passes it to `dataVizService.renderChart()`, which then uses ECharts to draw the visualization on the canvas.

## 4. Database Layer (PostgreSQL & Alembic)

*   **PostgreSQL:** Chosen for its robustness, scalability, and strong support for relational data.
*   **SQLAlchemy 2.0:** Python ORM used for interacting with PostgreSQL. Provides an asynchronous interface (`asyncio`).
*   **Alembic:** Database migration tool integrated with SQLAlchemy. It's used to manage schema changes in a version-controlled manner, ensuring database consistency across environments. Migrations are run automatically on service startup in the `docker-compose.yml`.

## 5. Caching and Rate Limiting (Redis)

*   **Redis:** An in-memory data structure store used for:
    *   **Data Caching:** Frequently accessed query results from external data sources are cached to reduce load on source systems and improve response times.
    *   **Rate Limiting:** Tracks API request counts per user/IP within defined time windows to prevent abuse and ensure fair resource access.

## 6. Deployment and Operations

*   **Docker & Docker Compose:** Used for local development and defining the production deployment environment. Each service runs in its own isolated container.
*   **CI/CD (GitHub Actions):** Automates testing (backend unit/integration/API, frontend unit/E2E) on every push/pull request. On merge to `main`, it triggers building Docker images and deploying them to a production server (e.g., via SSH to pull and restart containers).
*   **Monitoring & Logging:** Structured logs facilitate integration with external logging platforms (e.g., ELK Stack, Grafana Loki). Health check endpoints are provided for readiness/liveness probes in orchestration systems like Kubernetes.

## 7. Security Considerations

*   **Authentication:** JWT tokens for API access, securely stored in browser's local storage or http-only cookies (if adopted).
*   **Authorization:** Role-based access control (RBAC) implemented through `is_superuser` and potentially more granular permissions.
*   **Password Security:** Passwords hashed using `bcrypt`.
*   **Sensitive Data:** Connection strings to external data sources are stored securely in the database. When retrieving sensitive config (e.g., API keys), care must be taken to not expose it directly to the frontend. Potentially use a Vault for highly sensitive secrets.
*   **CORS:** Configured to allow only trusted frontend origins.
*   **Rate Limiting:** Protects against brute-force attacks and API abuse.
*   **Input Validation:** Pydantic schemas enforce strict validation on all incoming API requests.
*   **SQL Injection:** SQLAlchemy ORM inherently protects against most SQL injection attacks. For raw SQL queries defined by users (e.g., in `Chart.query`), parameterized queries are used (`text(query), params=params`) to prevent injections. However, allowing arbitrary SQL can still be a security risk (e.g., privilege escalation, denial of service) and should be managed with strict permissions and query sanitization/validation.

This architecture provides a solid foundation for a scalable and maintainable enterprise data visualization platform.
```