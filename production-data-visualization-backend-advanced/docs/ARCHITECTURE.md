# DataViz Pro: Architecture Documentation

## 1. High-Level Architecture

The DataViz Pro system follows a client-server architecture, specifically a **Monorepo with a decoupled Frontend and Backend**. Both components are containerized using Docker, communicating over a defined API.

```
+----------------+       +-------------------+       +-----------------+
|   Web Browser  | <---> |   React Frontend  | <---> | Node.js Backend | <---> PostgreSQL
| (User Interface) |       |  (UI/Client-side) |       |   (API Server)  |       (Database)
+----------------+       +-------------------+       +-----------------+
        ^                        ^ ^ ^                       ^ ^
        |________________________| | |_______________________| |
                 Internet/LAN        |                             Docker Network
                                   Load Balancer/Reverse Proxy (e.g., Nginx)
```

## 2. Component Breakdown

### 2.1. Frontend (React Application)

*   **Technology:** React, Chakra UI, Echarts-for-React, React Router DOM, Axios.
*   **Purpose:** Provides the interactive user interface for creating, viewing, and managing data visualizations.
*   **Key Responsibilities:**
    *   User Authentication (Login/Register) and Session Management (JWT storage).
    *   Dashboard Builder: Drag-and-drop interface for arranging charts using `react-grid-layout`.
    *   Chart Editor: Forms for configuring chart types, data sources, and Echarts JSON options.
    *   Data Source Forms: Interface for defining various data connections.
    *   Data Visualization: Renders charts using `Echarts` library, fetching data and configuration from the backend.
    *   Routing: Manages navigation between different application views.
    *   Global State Management: `AuthContext` for user authentication state.
*   **Communication:** Communicates with the Backend API via `Axios` HTTP client.
*   **Deployment:** Served as static files (e.g., by Nginx in a production Docker container).

### 2.2. Backend (Node.js Express API)

*   **Technology:** Node.js, Express.js, Sequelize (ORM), PostgreSQL.
*   **Purpose:** Serves as the API gateway and business logic layer for the application.
*   **Key Responsibilities:**
    *   **API Endpoints:** Implements RESTful APIs for CRUD operations on Users, Data Sources, Charts, and Dashboards.
    *   **Authentication & Authorization:** JWT token validation, user role checks (`protect`, `authorize` middleware).
    *   **Data Processing:** Aggregates/transforms data fetched from data sources before sending to the frontend for visualization. (Simplified for mock data in this demo, but extensible).
    *   **Database Interaction:** Manages persistence using Sequelize ORM to interact with PostgreSQL.
    *   **Error Handling:** Centralized middleware for graceful error responses.
    *   **Logging:** Utilizes Winston for structured application logging.
    *   **Caching:** In-memory caching (`node-cache`) for frequently accessed data to improve response times.
    *   **Rate Limiting:** Protects API from excessive requests (`express-rate-limit`).
*   **Structure:** Follows a layered architecture:
    *   **`routes`**: Defines API endpoints and links to controllers.
    *   **`controllers`**: Handles incoming requests, validates input, calls services, and sends responses.
    *   **`services`**: Contains the core business logic, orchestrating interactions with models/database and external resources.
    *   **`models`**: Sequelize ORM definitions for database schema.
    *   **`middleware`**: Handles cross-cutting concerns (auth, error, logging, caching, rate limiting).
    *   **`config`**: Environment-specific configurations and database settings.
    *   **`utils`**: Helper functions, custom error classes, logger.

### 2.3. Database (PostgreSQL)

*   **Technology:** PostgreSQL.
*   **Purpose:** Relational database for storing all application data.
*   **Key Responsibilities:**
    *   User accounts, roles, and credentials (hashed passwords).
    *   Definitions and configurations of Data Sources.
    *   Definitions and Echarts configurations of Charts.
    *   Definitions and layout information of Dashboards.
*   **Management:** Managed through Sequelize ORM, migrations, and seeders.
*   **Query Optimization:** Indices on foreign keys and frequently queried columns (username, email, data source/chart/dashboard IDs) are crucial for performance in production.

## 3. Deployment & Infrastructure

*   **Containerization:**
    *   **Docker:** Used to containerize the frontend (React + Nginx), backend (Node.js), and database (PostgreSQL).
    *   **Docker Compose:** Orchestrates multi-container applications for local development and simplified single-server deployments.
*   **CI/CD (GitHub Actions):**
    *   **Continuous Integration (`ci.yml`):** Automatically runs tests (backend unit/integration, frontend unit) on every push/pull request. Ensures code quality and prevents regressions.
    *   **Continuous Deployment (`cd.yml`):** Builds Docker images, pushes them to a container registry (e.g., Docker Hub), and deploys to a target environment (e.g., a staging or production server). The provided `cd.yml` is a conceptual example for a basic server deployment.
*   **Environments:** Differentiates between `development`, `test`, and `production` environments using `.env` files and `NODE_ENV` variable. Each environment might use different database configurations, API endpoints, and logging levels.

## 4. Security Considerations

*   **Authentication:** JWTs for stateless authentication. Passwords hashed using `bcryptjs`.
*   **Authorization:** Role-based access control (RBAC) enforced at the API level using middleware.
*   **Data Validation:** Input validation on both frontend and backend to prevent injection attacks and ensure data integrity.
*   **Error Handling:** Generic error messages in production to avoid leaking sensitive information.
*   **CORS:** Explicitly configured to allow requests only from the frontend URL.
*   **Helmet:** (Implicit in `app.js` example) Used to set various HTTP headers for security (XSS, CSRF protection, etc.).
*   **Rate Limiting:** Prevents brute-force attacks and resource exhaustion.
*   **Environment Variables:** Sensitive information (JWT secret, database credentials) stored as environment variables.

## 5. Scalability & Maintainability

*   **Modularity:** Clear separation of concerns (models, services, controllers, middleware) enhances maintainability.
*   **Layered Architecture:** Each layer has a specific responsibility, making it easier to understand, test, and replace components.
*   **Containerization:** Allows for easy scaling of individual services (e.g., running multiple backend instances behind a load balancer).
*   **Database:** PostgreSQL is a robust and scalable RDBMS.
*   **Caching:** Reduces database load and improves response times for read-heavy operations.
*   **Logging & Monitoring:** Structured logging (Winston) is crucial for debugging and operational visibility. In a real enterprise setup, this would integrate with external monitoring systems (e.g., Prometheus/Grafana, ELK stack).

---