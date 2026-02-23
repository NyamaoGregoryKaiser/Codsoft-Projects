```markdown
# Architecture Documentation

This document provides a high-level overview of the architecture for the Enterprise Data Visualization Tools System.

## 1. Overview

The system is a full-stack web application designed to allow users to connect to various data sources, create data visualizations, and organize them into interactive dashboards. It follows a modular, layered architecture to ensure scalability, maintainability, and clear separation of concerns.

The application is primarily composed of:
*   **Frontend:** A Single Page Application (SPA) built with React.
*   **Backend:** A RESTful API server built with Python Flask.
*   **Database:** PostgreSQL for persistent storage of application metadata (users, data sources, viz configs, dashboard configs).
*   **Caching/Rate Limiting:** Redis for high-speed data caching and rate limit enforcement.
*   **Containerization:** Docker and Docker Compose for development and deployment.

---

## 2. High-Level Diagram

```mermaid
graph TD
    User(Web Browser / User) -->|HTTP/HTTPS| Nginx(Nginx Proxy / Web Server)
    Nginx -->|Static Files| Frontend(React SPA)
    Frontend -->|HTTP API Requests| Nginx
    Nginx -->|Proxy /api/ to Backend| Backend(Python Flask API)

    Backend -->|SQLAlchemy ORM| PostgreSQL(PostgreSQL Database)
    Backend -->|Flask-Caching / Flask-Limiter| Redis(Redis Cache / Rate Limit Store)
    Backend -->|Data Processing Service (Pandas, SQLAlchemy Core)| ExternalDataSources(External Data Sources e.g. PostgreSQL, MySQL, CSV)

    subgraph Infrastructure
        Nginx
        Backend
        PostgreSQL
        Redis
    end

    subgraph Deployment
        Docker(Docker Containers)
        DockerCompose(Docker Compose)
        CI_CD(GitHub Actions CI/CD)
    end

    DockerCompose --- Docker
    CI_CD --> Docker
    CI_CD --> Deployment
```

---

## 3. Component Breakdown

### 3.1. Frontend (React SPA)

*   **Purpose:** Provides the user interface for interacting with the data visualization system.
*   **Technology:** React, React Router, Axios, UI libraries (e.g., Tailwind CSS).
*   **Key Responsibilities:**
    *   **User Interface:** Renders dynamic pages for login, registration, data source management, visualization building, and dashboard viewing.
    *   **Routing:** Manages client-side navigation between different views.
    *   **State Management:** Utilizes React Context API for global state (e.g., authentication) and local state for components.
    *   **API Interaction:** Communicates with the Backend API using Axios to send/receive data.
    *   **Authentication Flow:** Handles user login, registration, token storage (cookies), and automatic token refreshing.
    *   **Visualization Rendering:** Integrates charting libraries (e.g., Nivo, Chart.js) to render various chart types based on configuration and data from the backend.
    *   **Dashboard Layout:** Manages draggable and resizable visualization components within a dashboard using a library like React Grid Layout.

### 3.2. Backend (Python Flask API)

*   **Purpose:** Provides a secure and scalable RESTful API for the frontend, handling business logic, data persistence, and integration with data sources.
*   **Technology:** Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Marshmallow, Flask-Caching, Flask-Limiter, Pandas.
*   **Key Modules:**
    *   `app/__init__.py`: Application factory, configuration loading, extension initialization, blueprint registration.
    *   `app/config.py`: Centralized application configuration for different environments (development, testing, production).
    *   `app/extensions.py`: Initializes Flask extensions (DB, JWT, Marshmallow, CORS, Cache, Limiter).
    *   `app/models/`: SQLAlchemy ORM models defining the database schema (User, DataSource, Visualization, Dashboard, Role).
    *   `app/auth/services.py`: Business logic for user registration and authentication.
    *   `app/services/`: Contains business logic services for Data Sources, Visualizations, and Dashboards, abstracting database interactions.
    *   `app/data_processing/services.py`: Handles connections to external data sources, executes queries, and performs basic data transformations. Integrates caching for query results.
    *   `app/api/`: Flask Blueprints defining API routes and their corresponding handlers for `auth`, `data_sources`, `visualizations`, and `dashboards`.
    *   `app/utils/`: Utility functions and decorators (e.g., `role_required` for authorization).
    *   `app/errors.py`: Custom error handlers for consistent API error responses.
*   **Key Features:**
    *   **RESTful API:** Standard CRUD operations for all major resources.
    *   **Authentication (JWT):** Secure token-based authentication.
    *   **Authorization (RBAC):** Role-Based Access Control to restrict access to certain actions based on user roles (`admin`, `editor`, `user`).
    *   **Data Validation & Serialization:** Uses Marshmallow for input validation and consistent JSON output.
    *   **Caching:** Leverages Redis via Flask-Caching to reduce database load and improve response times for frequently accessed data and query results.
    *   **Rate Limiting:** Protects API endpoints from abuse using Redis via Flask-Limiter.
    *   **Logging:** Configured to log application events and errors.

### 3.3. Database (PostgreSQL)

*   **Purpose:** Stores all application metadata, including user accounts, data source connection details (encrypted), visualization configurations, and dashboard layouts.
*   **Technology:** PostgreSQL.
*   **ORM:** SQLAlchemy.
*   **Migrations:** Alembic for managing schema changes.
*   **Schema:** `User`, `Role`, `DataSource`, `Visualization`, `Dashboard` (and their many-to-many relationships).

### 3.4. Caching & Rate Limiting Store (Redis)

*   **Purpose:** A fast, in-memory data store used for:
    *   **API Response Caching:** Storing results of expensive API calls.
    *   **Data Query Caching:** Caching results from external data sources to prevent redundant queries.
    *   **Rate Limit Tracking:** Storing counters for API rate limiting.
*   **Technology:** Redis.

### 3.5. External Data Sources

*   **Purpose:** The actual data stores that users want to visualize (e.g., production databases, data warehouses, file storage).
*   **Connection:** The backend's `DataProcessingService` connects to these sources using SQLAlchemy core/Pandas via provided (encrypted) connection strings.
*   **Supported Types (example):** PostgreSQL, MySQL, CSV files. extensible for more.

---

## 4. Data Flow

1.  **User Interaction:** A user interacts with the React frontend (e.g., logs in, creates a data source, views a dashboard).
2.  **Frontend API Call:** The React frontend makes an HTTP request to the Nginx proxy, which forwards it to the Flask Backend API. The request includes the JWT Access Token for authentication.
3.  **Backend Request Processing:**
    *   Flask-Limiter checks if the request exceeds rate limits.
    *   Flask-JWT-Extended authenticates the user and extracts user ID and roles.
    *   `@role_required` decorator enforces authorization.
    *   Flask-Caching checks if a cached response is available for `GET` requests; if so, it returns immediately.
    *   The relevant API endpoint in `app/api/` is called.
4.  **Business Logic (Service Layer):** The API endpoint calls methods in the appropriate `app/services/` module (e.g., `DataSourceService`, `VisualizationService`).
5.  **Database Interaction (ORM):** The service layer interacts with `app/models/` (SQLAlchemy) to perform CRUD operations on the PostgreSQL database.
6.  **External Data Processing:** If a request involves fetching data for a visualization, `DataProcessingService` is invoked:
    *   It retrieves the `DataSource` configuration from PostgreSQL.
    *   It establishes a connection to the external data source (e.g., a customer's PostgreSQL database).
    *   It executes the user-defined query.
    *   It may cache the results in Redis using `@cache.memoize()`.
    *   It returns the processed data.
7.  **Response Generation:** The service layer returns data to the API endpoint, which uses Flask-Marshmallow to serialize the data into a consistent JSON format.
8.  **Frontend Rendering:** The JSON response is sent back through Nginx to the React frontend. The frontend updates its state and renders the new data (e.g., displaying a new chart, updating a list of data sources).

---

## 5. Security Considerations

*   **Authentication:** JWT with secure secret keys. Access and Refresh token separation.
*   **Authorization:** Role-Based Access Control ensures users only access resources and perform actions permitted by their roles.
*   **Data Source Credentials:** `connection_string` in `DataSource` model is critical. In a production system, this *must* be encrypted at rest (e.g., using Flask-SQLAlchemy-Crypto, KMS, or HashiCorp Vault) and decrypted only when establishing a connection.
*   **Input Validation:** Marshmallow schemas are used to validate incoming API request data, preventing common injection attacks and malformed data.
*   **CORS:** Configured to allow requests only from trusted frontend origins.
*   **Rate Limiting:** Prevents brute-force attacks and denial-of-service.
*   **Logging:** Comprehensive logging helps in auditing and detecting security incidents.
*   **Dependencies:** Regularly update dependencies to patch known vulnerabilities.
*   **Docker Security:** Use slim base images, non-root users in containers, and scan images for vulnerabilities.

---

## 6. Scalability

*   **Stateless Backend:** Flask API is designed to be stateless, allowing for easy horizontal scaling by running multiple Gunicorn instances behind a load balancer.
*   **Database Scaling:** PostgreSQL can be scaled vertically or horizontally (read replicas, sharding) as needed.
*   **Caching with Redis:** Reduces load on the database, allowing it to handle more write operations and complex queries.
*   **Asynchronous Tasks (Future Enhancement):** For long-running data processing tasks (e.g., complex ETL, large report generation), integrate a task queue like Celery with Redis as a broker.
*   **Frontend Scaling:** React SPA served by Nginx is highly scalable, benefiting from CDNs for static asset delivery.
```