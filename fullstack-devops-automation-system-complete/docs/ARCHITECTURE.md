# Architecture Documentation: Product Catalog Management System

This document outlines the high-level architecture of the Product Catalog Management System, focusing on its components, their interactions, and the underlying technologies.

## 1. High-Level Overview

The system employs a classic client-server architecture with a modern full-stack approach. It consists of a decoupled frontend (Single Page Application), a robust backend API, a relational database, and an Nginx reverse proxy acting as the entry point. All services are containerized using Docker for portability and ease of deployment.

```
+------------------+     +----------------+     +----------------+
|    User / Admin  |-----|    Browser     |-----|     Nginx      |
+------------------+     +----------------+     +----------------+
                               (HTTP/HTTPS)             |
                                                        | Reverse Proxy
                                                        |
       +------------------+---------------------+-----------------------+
       |                  |                     |                       |
       |  +-----------+   |   +-------------+   |   +-------------+     |
       |  | Frontend  |   |   |  Backend    |   |   |  Database   |     |
       |  | (React)   |<---->|  (Node.js)  |<---->|  (PostgreSQL) |     |
       |  +-----------+   |   +-------------+   |   +-------------+     |
       |                  |                     |                       |
       |  (Served by Nginx)| (API Endpoints)     | (Data Storage)        |
       |                  |                     |                       |
       +------------------+---------------------+-----------------------+
                                  (Docker Network)
```

## 2. Component Breakdown

### 2.1. Frontend (Client Layer)

*   **Technology:** React.js, TypeScript, Vite
*   **Purpose:** Provides the user interface for interacting with the Product Catalog. It allows users and administrators to view, add, edit, and delete products and categories, as well as handle user authentication.
*   **Key Features:**
    *   Single Page Application (SPA).
    *   Uses React Context for global state management (e.g., authentication status).
    *   Communicates with the Backend API via RESTful calls (Axios).
    *   Client-side routing with React Router DOM.
    *   Component-based UI for reusability and maintainability.
*   **Deployment:** Built into static assets and served by Nginx.

### 2.2. Backend (API Layer)

*   **Technology:** Node.js, Express.js, TypeScript
*   **Purpose:** Exposes a RESTful API to the frontend and other potential clients. It handles business logic, data validation, authentication, authorization, and interacts with the database.
*   **Key Modules:**
    *   **Authentication/Authorization:** Manages user registration, login, JWT token generation, and middleware to protect routes based on roles.
    *   **User Management:** CRUD operations for user accounts.
    *   **Product Management:** CRUD operations for product entities.
    *   **Category Management:** CRUD operations for category entities.
    *   **Services:** Encapsulate business logic and database interactions for each module.
    *   **Controllers:** Handle incoming HTTP requests, validate data, call services, and send responses.
    *   **Middleware:** Centralized error handling, logging, rate limiting, and caching.
*   **Deployment:** Containerized within a Docker container.

### 2.3. Database Layer

*   **Technology:** PostgreSQL
*   **ORM:** TypeORM (used by the Backend)
*   **Purpose:** Persistent storage for all application data, including users, products, and categories.
*   **Key Features:**
    *   Relational database ensuring data integrity.
    *   TypeORM handles schema synchronization, migrations, and query building.
    *   Supports complex queries and transactions.
*   **Deployment:** Containerized within a Docker container, with data volume mapping for persistence.

### 2.4. Nginx (Reverse Proxy/Load Balancer)

*   **Technology:** Nginx
*   **Purpose:** Acts as the entry point for all incoming HTTP/HTTPS requests.
*   **Key Functions:**
    *   **Static File Serving:** Serves the built frontend static assets directly.
    *   **API Proxying:** Forwards API requests (e.g., `/api/*`) to the Backend service.
    *   **Load Balancing:** (Not explicitly configured for multiple instances in `docker-compose.yml`, but Nginx is capable of this for scaled deployments).
    *   **SSL Termination:** (Can be configured for HTTPS in a production environment).
    *   **Logging:** Access logs for incoming requests.
*   **Deployment:** Containerized within a Docker container.

## 3. Communication Flow

1.  **User Access:** A user opens their browser and navigates to the application URL (e.g., `http://localhost`).
2.  **Nginx as Entry Point:** The request first hits the Nginx server.
3.  **Frontend Serving:** Nginx serves the static HTML, CSS, and JavaScript files of the React frontend application.
4.  **API Requests:** When the frontend needs data or to perform actions (e.g., login, fetch products), it sends API requests to `/api/*`.
5.  **Nginx API Proxy:** Nginx intercepts these `/api/*` requests and proxies them to the Backend service within the Docker network.
6.  **Backend Processing:** The Backend API receives the request, processes it (authentication, authorization, business logic), and interacts with the Database via TypeORM.
7.  **Database Interaction:** The Database stores and retrieves data as instructed by the Backend.
8.  **Response Back:** The Backend sends the processed response back to Nginx, which then forwards it to the Frontend.
9.  **Frontend Rendering:** The Frontend receives the API response and updates the UI accordingly.

## 4. DevOps and Infrastructure

### 4.1. Containerization (Docker)

*   Each core service (Frontend, Backend, Database, Nginx) runs in its own isolated Docker container.
*   `Dockerfile`s define how to build images for each service, ensuring consistent environments.

### 4.2. Orchestration (Docker Compose)

*   `docker-compose.yml` defines the multi-container application.
*   Manages network configuration, environment variables, port mappings, and service dependencies.
*   Facilitates easy local development and testing of the entire stack.

### 4.3. Continuous Integration/Continuous Deployment (GitHub Actions)

*   Automated workflows triggered on code pushes and pull requests.
*   **Build:** Compiles TypeScript, builds React assets.
*   **Test:** Runs unit, integration, and API tests for both backend and frontend.
*   **Linting:** Enforces code quality standards.
*   **Docker Build:** Creates production-ready Docker images.
*   **Deployment:** (Simulated in this example) Placeholder for deploying built artifacts/images to a cloud provider or Kubernetes.

### 4.4. Logging and Monitoring

*   **Backend:** Uses `Winston` for structured logging, allowing easy integration with log aggregation tools.
*   **Monitoring:** (Out of scope for direct implementation here, but would involve tools like Prometheus/Grafana, cloud-specific monitoring services, APM tools like New Relic/Datadog).

### 4.5. Security Considerations

*   **Authentication:** JWT-based tokens for stateless authentication.
*   **Authorization:** Role-based access control implemented in backend middleware.
*   **Rate Limiting:** Protects against brute-force attacks and API abuse.
*   **Environment Variables:** Sensitive information is stored in environment variables, not in code.
*   **Helmet:** Express middleware for setting various HTTP headers to improve security.
*   **CORS:** Configured to allow requests from the frontend origin.

## 5. Scalability and Reliability

*   **Stateless Backend:** The backend is designed to be largely stateless (JWT for authentication), making it easier to scale horizontally by running multiple instances behind a load balancer.
*   **Database Scalability:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding) depending on the needs.
*   **Containerization:** Provides a portable and isolated environment, simplifying deployment and scaling.
*   **Nginx:** Capable of distributing traffic across multiple backend instances.
*   **Caching:** Reduces database load for frequently accessed data.

This architecture provides a solid foundation for a modern web application, balancing simplicity for development with robustness and scalability for production environments.

---
### 3. `docs/API.md`