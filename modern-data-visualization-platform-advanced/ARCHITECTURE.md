# DataViz System Architecture

This document outlines the high-level architecture of the DataViz application, detailing its components, interactions, and design principles.

## 1. Overview

The DataViz system is a full-stack web application designed for creating and managing data visualizations. It follows a modular, microservices-like approach with a clear separation of concerns between the frontend, backend API, and data storage layers.

```mermaid
graph TD
    User(Browser/Client) -->|HTTP/S| Frontend(React/TypeScript)
    Frontend -->|HTTP/S API Requests| Nginx(Nginx Proxy)
    Nginx -->|Proxy| Backend(FastAPI / Python)

    subgraph Backend Services
        Backend --- Caching(Redis: Caching & Rate Limiting)
        Backend -->|AsyncPG / SQLAlchemy| Database(PostgreSQL)
        Backend -.->|External Connections| DataSources(Other SQL DBs, APIs, Filesystems)
    end

    subgraph Core Backend Modules
        Backend -- app/api --> APIEndpoints[API Endpoints (Users, Datasets, Dashboards, Charts)]
        Backend -- app/dependencies --> Dependencies[Dependency Injection (Auth, DB Session)]
        Backend -- app/services --> BusinessLogic[Business Logic (Data Retrieval/Transform, Chart Gen)]
        Backend -- app/crud --> CRUDLayer[CRUD Operations (Database Interaction)]
        Backend -- app/models --> ORMModels[SQLAlchemy ORM Models]
        Backend -- app/schemas --> PydanticSchemas[Request/Response Validation]
        Backend -- app/core --> CoreConfig[Config, Security, Exceptions]
        Backend -- app/utils --> Utilities[Logging, Rate Limiting Utils]
    end
```

## 2. Components

### 2.1. Frontend (Client-side)

*   **Technology:** React 18+, TypeScript, Vite, Chakra UI, React Router, React Query, Chart.js.
*   **Purpose:** Provides the user interface for interacting with the system. It's responsible for rendering dashboards, chart builders, dataset explorers, and managing user authentication flows.
*   **Key Responsibilities:**
    *   Displaying interactive charts and dashboards.
    *   Allowing users to create, configure, and manage datasets, charts, and dashboards.
    *   Handling user input and state management.
    *   Making API calls to the backend.
    *   Client-side routing and UI/UX presentation.
*   **Deployment:** Built into static assets and served by Nginx.

### 2.2. Nginx (Reverse Proxy for Frontend)

*   **Purpose:** Serves the static React application files and acts as a reverse proxy for API requests, routing them to the backend service. This simplifies deployment and allows the frontend and backend to appear under the same origin.
*   **Key Responsibilities:**
    *   Serving static HTML, CSS, JavaScript for the React app.
    *   Routing `/api/` requests to the `backend` service.
    *   Can handle SSL termination in a production setup (not included in `docker-compose.yml` for simplicity).

### 2.3. Backend (API Server)

*   **Technology:** FastAPI (Python 3.11+), Uvicorn, SQLAlchemy (with AsyncPG), Pydantic, PyJWT, Passlib.
*   **Purpose:** Provides RESTful API endpoints for all data and business logic operations. It's the brain of the application, handling data persistence, business rules, authentication, and data retrieval from various sources.
*   **Key Responsibilities:**
    *   **API Endpoints:** Exposes `/api/v1/...` for Users, Datasets, Dashboards, and Charts (CRUD operations).
    *   **Authentication & Authorization:** Validates user tokens and enforces access control.
    *   **Business Logic:** Contains the core logic for creating/updating charts, dashboards, and processing dataset definitions.
    *   **Data Management:** Interacts with the PostgreSQL database for storing metadata (users, dataset definitions, chart configurations).
    *   **Data Source Integration:** (Conceptual) Connects to and retrieves data from various external data sources (e.g., CSV files, SQL databases, other APIs).
    *   **Caching:** Leverages Redis to cache frequently accessed data or API responses to improve performance.
    *   **Rate Limiting:** Implements request rate limiting to protect against abuse.
    *   **Logging & Monitoring:** Provides structured application logs.
    *   **Error Handling:** Catches and standardizes API error responses.
*   **Structure:**
    *   `app/main.py`: FastAPI application entry point, middleware, exception handlers.
    *   `app/api/v1/`: Organizes API routes by resource.
    *   `app/core/`: Global configurations, security utilities (JWT, password hashing), custom exceptions.
    *   `app/schemas/`: Pydantic models for request body validation and response serialization.
    *   `app/models/`: SQLAlchemy ORM models defining database schema.
    *   `app/crud/`: Layer for direct database CRUD operations, abstracting ORM details.
    *   `app/services/`: Business logic layer, orchestrating CRUD operations and external integrations.
    *   `app/dependencies/`: FastAPI dependency injection for DB sessions, current user, etc.

### 2.4. Database (Data Persistence)

*   **Technology:** PostgreSQL 16.
*   **Purpose:** Stores all application metadata, including user accounts, dataset definitions, chart configurations, and dashboard layouts.
*   **Key Responsibilities:**
    *   Persistent storage for all structured application data.
    *   Ensuring data integrity and relationships.
*   **Migration:** Alembic is used for database schema migrations, ensuring controlled evolution of the database.

### 2.5. Caching & Rate Limiting (Redis)

*   **Technology:** Redis 7.
*   **Purpose:** Enhances performance and protects the backend from excessive requests.
*   **Key Responsibilities:**
    *   **Caching:** Stores API responses or computed data for a specified duration, reducing load on the database and improving response times for repetitive requests.
    *   **Rate Limiting:** Tracks request counts per user/IP over time and blocks requests exceeding defined thresholds.

## 3. Data Flow

1.  **User Interaction:** A user interacts with the React frontend (e.g., logs in, navigates to a dashboard, creates a chart).
2.  **Frontend API Call:** The React app sends an HTTP request (e.g., `GET /api/v1/dashboards/123`) to the Nginx proxy.
3.  **Nginx Proxy:** Nginx receives the request, identifies it as an API call (based on `/api/` prefix), and forwards it to the `backend` service (FastAPI).
4.  **Backend Processing:**
    *   FastAPI receives the request.
    *   **Middleware:** Processes the request (e.g., logging, timing, CORS).
    *   **Authentication Dependency:** `get_current_active_user` dependency validates the JWT token, authenticates the user, and attaches user info to the request state.
    *   **Rate Limiting:** `FastAPILimiter` checks if the user/IP has exceeded their allowed request rate.
    *   **Caching:** `FastAPICache` checks if the response for this request is already in Redis. If so, it returns the cached response immediately.
    *   **Service Layer:** If not cached, the relevant service (e.g., `dashboard_service`) is invoked.
    *   **CRUD Layer:** The service layer calls the CRUD layer to interact with the database (e.g., `crud_dashboard.get_with_charts`).
    *   **Database Interaction:** SQLAlchemy translates Python ORM calls into SQL queries, which are executed against PostgreSQL via `asyncpg`.
    *   **Data Retrieval/Transformation:** If the request involves chart data, the `chart_service` might retrieve raw data (from another data source, conceptualized as `dataset_service.get_dataset_data`) and perform basic transformations (e.g., pandas-based processing) to format it for the frontend charting library.
5.  **Backend Response:** FastAPI constructs a Pydantic-validated JSON response.
6.  **Nginx & Frontend:** Nginx forwards the response back to the frontend, which then renders the updated UI (e.g., displays the dashboard with its charts).

## 4. Scalability Considerations

*   **Stateless Backend:** FastAPI is largely stateless, allowing for easy horizontal scaling of the backend service. Multiple instances can run behind a load balancer.
*   **Asynchronous I/O:** FastAPI and SQLAlchemy's async capabilities ensure efficient handling of concurrent requests, minimizing blocking operations.
*   **Database Scaling:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding) as needed.
*   **Caching:** Redis significantly reduces database load for read-heavy operations.
*   **Containerization:** Docker and Docker Compose provide portability and isolated environments, facilitating deployment and scaling.
*   **Separation of Concerns:** Modular design makes it easier to extend or replace individual components (e.g., swap out charting library, add new data sources).

## 5. Security Considerations

*   **JWT Authentication:** Secure token-based authentication.
*   **Password Hashing:** `bcrypt` for secure storage of user passwords.
*   **Input Validation:** Pydantic schemas enforce strict validation of incoming request data.
*   **CORS:** Configured to restrict access to allowed origins.
*   **Rate Limiting:** Mitigates brute-force attacks and denial-of-service attempts.
*   **Environment Variables:** Sensitive configuration details are loaded from environment variables, not hardcoded.
*   **Least Privilege:** Users only access their own data/resources unless explicitly granted superuser roles.

This architecture provides a robust and scalable foundation for a production-ready data visualization system.