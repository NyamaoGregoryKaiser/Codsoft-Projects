# Task Management System

A comprehensive, production-ready full-stack Task Management System built with Spring Boot (Java) for the backend and React (TypeScript) for the frontend, utilizing PostgreSQL as the database.

## Table of Contents
1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Setup with Docker Compose](#local-setup-with-docker-compose)
    *   [Backend (Manual Setup)](#backend-manual-setup)
    *   [Frontend (Manual Setup)](#frontend-manual-setup)
5.  [Running the Application](#running-the-application)
6.  [API Documentation](#api-documentation)
7.  [Testing](#testing)
8.  [CI/CD](#ci-cd)
9.  [Deployment Guide](#deployment-guide)
10. [Further Enhancements](#further-enhancements)
11. [Contributing](#contributing)
12. [License](#license)

## 1. Features

*   **User Management:** Register, Login, Logout, Role-based access control (User, Admin).
*   **Project Management:** CRUD operations for projects, assign projects to users.
*   **Task Management:** CRUD operations for tasks, assign tasks to projects and users, update task status (To Do, In Progress, Done, Blocked).
*   **Authentication & Authorization:** JWT-based authentication, Spring Security for backend, Protected Routes for frontend.
*   **Error Handling:** Global exception handling for consistent API responses.
*   **Logging & Monitoring:** Structured logging (Logback), Spring Boot Actuator endpoints.
*   **Caching:** Backend caching with Caffeine for frequently accessed data (e.g., projects, tasks).
*   **Rate Limiting:** Protects API endpoints from excessive requests.
*   **Data Validation:** Server-side validation for DTOs.
*   **Database Migrations:** Flyway for managing database schema evolution.

## 2. Architecture

The system follows a typical microservices-oriented, layered architecture:

*   **Frontend (React):** A single-page application (SPA) providing the user interface. Communicates with the backend via RESTful APIs.
*   **Backend (Spring Boot):** A RESTful API server handling business logic, data processing, and persistence.
    *   **Controllers:** Expose API endpoints.
    *   **Services:** Implement business logic, orchestrate data operations.
    *   **Repositories:** Interact with the database (JPA).
    *   **Security Layer:** Manages authentication (JWT) and authorization (Spring Security).
    *   **Configuration:** Centralized configuration for the application.
*   **Database (PostgreSQL):** Relational database storing all application data.
*   **Containerization (Docker):** Packages the application and its dependencies into isolated containers for consistent deployment.

```
+---------------------+           +---------------------+           +---------------------+
|                     |           |                     |           |                     |
|    Frontend (React) |<--------->| Backend (Spring Boot)|<--------->|    Database         |
|                     |           |                     |           |    (PostgreSQL)     |
+---------------------+           +---------------------+           +---------------------+
       |                                   |                                   |
       |  (Browser/API Calls)              |  (REST API)                       |  (JPA/JDBC)
       v                                   v                                   v
+---------------------+           +---------------------+           +---------------------+
| UX/UI Components    |           | Controllers (REST)  |           | Schema Definitions  |
| State Management    |           | Services (Business) |           | Migrations (Flyway) |
| API Integration     |           | Repositories (JPA)  |           | Seed Data           |
+---------------------+           | Security (JWT)      |
                                  | Caching             |
                                  | Rate Limiting       |
                                  | Logging/Monitoring  |
                                  | Error Handling      |
                                  +---------------------+
```

## 3. Technologies Used

**Backend:**
*   **Java 17+**
*   **Spring Boot 3+**
*   **Spring Data JPA** (Hibernate)
*   **Spring Security** (JWT-based Authentication)
*   **Maven** (Dependency Management)
*   **PostgreSQL** (Database)
*   **Flyway** (Database Migrations)
*   **Lombok** (Boilerplate reduction)
*   **ModelMapper** (DTO to Entity mapping)
*   **Caffeine** (Local Caching)
*   **jjwt** (JSON Web Tokens)

**Frontend:**
*   **React 18+**
*   **TypeScript**
*   **Vite** (Build Tool)
*   **React Router DOM** (Routing)
*   **Axios** (HTTP Client)
*   **Tailwind CSS** (Styling)
*   **React Toastify** (Notifications)
*   **jwt-decode** (Client-side JWT decoding)

**DevOps/Tools:**
*   **Docker**
*   **Docker Compose**
*   **Git**
*   **GitHub Actions** (CI/CD)

## 4. Setup and Installation

### Prerequisites
*   Git
*   Docker & Docker Compose (recommended for local setup)
*   Java Development Kit (JDK 17 or higher) (for manual backend setup)
*   Maven (for manual backend setup)
*   Node.js (LTS version, for manual frontend setup)
*   npm or yarn (for manual frontend setup)

### Local Setup with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/task-management-system.git
    cd task-management-system
    ```

2.  **Build and run the Docker containers:**
    This command will build the backend and frontend Docker images, set up the PostgreSQL database, and start all services.
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Builds images before starting containers.
    *   `-d`: Runs containers in detached mode (in the background).

3.  **Verify services are running:**
    ```bash
    docker compose ps
    ```
    You should see `postgres`, `backend`, and `frontend` containers running.

4.  **Access the application:**
    *   Frontend: `http://localhost:80`
    *   Backend API: `http://localhost:8080/api` (or through the frontend's `/api` proxy)

### Backend (Manual Setup)

1.  **Navigate to the backend directory:**
    ```bash
    cd task-management-system
    ```

2.  **Configure Database:**
    *   Ensure PostgreSQL is running locally (e.g., on port 5432).
    *   Create a database named `taskmanager` with user `postgres` and password `postgres` (or modify `src/main/resources/application.yml`).
    *   Flyway migrations will run automatically on startup to create schema and seed initial data.

3.  **Build the backend:**
    ```bash
    mvn clean install -DskipTests
    ```

4.  **Run the backend:**
    ```bash
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080`.

### Frontend (Manual Setup)

1.  **Navigate to the frontend directory:**
    ```bash
    cd task-management-system/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Configure API Base URL:**
    Create a `.env.development` file in the `frontend/` directory with the following content:
    ```
    VITE_API_BASE_URL=http://localhost:8080/api
    ```

4.  **Run the frontend in development mode:**
    ```bash
    npm run dev
    # or yarn dev
    ```
    The frontend will typically start on `http://localhost:5173`.

## 5. Running the Application

*   **With Docker Compose:** `docker compose up -d`
    *   Frontend: `http://localhost`
    *   Backend: `http://localhost:8080` (API routes under `/api`)

*   **Manually:**
    1.  Start Backend (Java `mvn spring-boot:run`)
    2.  Start Frontend (React `npm run dev`)

**Initial Users (from `V2__Add_seed_data.sql`):**
*   **Admin:**
    *   Username: `admin`
    *   Email: `admin@task.com`
    *   Password: `admin`
*   **User:**
    *   Username: `user`
    *   Email: `user@task.com`
    *   Password: `user`

## 6. API Documentation

The backend exposes RESTful APIs. For full API documentation, Swagger/OpenAPI can be integrated.
*(Note: Swagger UI is not included in the provided skeleton for brevity, but is highly recommended for production.)*

**Key Endpoints:**

*   **Authentication:**
    *   `POST /api/auth/register`: Register a new user.
    *   `POST /api/auth/login`: Authenticate user and get JWT token.
*   **Projects:**
    *   `GET /api/projects`: Get all projects (paginated).
    *   `GET /api/projects/my-projects`: Get projects created by the authenticated user.
    *   `GET /api/projects/{id}`: Get a project by ID.
    *   `POST /api/projects`: Create a new project.
    *   `PUT /api/projects/{id}`: Update an existing project.
    *   `DELETE /api/projects/{id}`: Delete a project.
*   **Tasks:**
    *   `GET /api/tasks`: Get all tasks (implement filters/pagination).
    *   `GET /api/projects/{projectId}/tasks`: Get tasks for a specific project.
    *   `GET /api/tasks/{id}`: Get a task by ID.
    *   `POST /api/projects/{projectId}/tasks`: Create a new task within a project.
    *   `PUT /api/tasks/{id}`: Update an existing task.
    *   `DELETE /api/tasks/{id}`: Delete a task.
*   **Users:**
    *   `GET /api/users/{id}`: Get user details (Admin or self-access).

## 7. Testing

The project includes various types of tests:

*   **Backend Unit Tests:** Located in `src/test/java/com/taskmanager/system/service/` and `src/test/java/com/taskmanager/system/util/`. Uses JUnit 5 and Mockito.
    *   Run with Maven: `mvn test`
    *   Coverage: Aim for 80%+ line coverage. (Tools like JaCoCo can be integrated for reports.)
*   **Backend Integration Tests:** Located in `src/test/java/com/taskmanager/system/controller/`. Uses Spring Boot Test and Testcontainers for a real database environment.
    *   Run with Maven: `mvn test` (these run as part of `mvn test`)
*   **Frontend Unit/Component Tests:** Located in `frontend/src/**/*.test.tsx`. Uses Vitest and React Testing Library.
    *   Run with npm: `cd frontend && npm test`
    *   Coverage: `cd frontend && npm run coverage`
*   **API Tests:** The integration tests cover API endpoint testing using `MockMvc`. For external API testing, tools like Postman, Newman, or RestAssured (already in `pom.xml` for integration tests) can be used.
*   **Performance Tests:** Not implemented in this skeleton, but tools like Apache JMeter or K6 are recommended for load testing the backend APIs.

## 8. CI/CD

A basic GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is provided for Continuous Integration and Continuous Deployment:

*   **`build-and-test-backend`:** Builds the Java backend and runs all its tests.
*   **`build-and-test-frontend`:** Installs Node dependencies, runs frontend tests, and builds the React application.
*   **`deploy`:** (Triggered on push to `main` branch after successful builds/tests)
    *   Logs into Docker Hub.
    *   Builds and pushes Docker images for both backend and frontend.
    *   Includes a placeholder step for deploying to a production server via SSH (pulling new images, restarting services). This step requires configuration of GitHub Secrets (e.g., `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`).

## 9. Deployment Guide

1.  **Containerized Deployment (Recommended):**
    *   Ensure Docker and Docker Compose are installed on your production server.
    *   Configure `docker-compose.yml` for production (e.g., replace `localhost` with actual database host if external, adjust volumes, network configurations, and set strong `JWT_SECRET`).
    *   Build images: `docker compose build`
    *   Run services: `docker compose up -d`
    *   For more complex scenarios, Kubernetes (K8s) deployment would be the next step, using Helm charts or K8s manifests.

2.  **Cloud Deployment:**
    *   **Backend:** Can be deployed as a JAR to platforms like AWS Elastic Beanstalk, Azure App Service, Google App Engine, or as a Docker container to AWS ECS/EKS, Azure AKS, Google GKE.
    *   **Frontend:** The built static assets (`frontend/dist`) can be served from a CDN like AWS S3 + CloudFront, Netlify, Vercel, or through an Nginx server.
    *   **Database:** Use a managed database service like AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL.

## 10. Further Enhancements

This project lays a solid foundation. Here are ideas for further enhancements to make it even more robust:

*   **Frontend:**
    *   More advanced UI/UX with a full component library (e.g., Ant Design, Material-UI).
    *   Comprehensive state management (e.g., Redux Toolkit, Zustand).
    *   Real-time updates using WebSockets (e.g., for task status changes).
    *   User profile management.
    *   Search and filtering for projects and tasks.
    *   Pagination and sorting in UI.
*   **Backend:**
    *   Swagger/OpenAPI integration for API documentation.
    *   Spring Boot Actuator for health checks and metrics.
    *   Advanced logging with ELK Stack (Elasticsearch, Logstash, Kibana) or Grafana Loki.
    *   Distributed tracing with Zipkin/Jaeger.
    *   Asynchronous operations (e.g., email notifications) with Spring Async or Kafka/RabbitMQ.
    *   Audit logging for critical operations.
    *   More complex authorization (e.g., ownership, fine-grained permissions).
    *   Internationalization (i18n).
    *   Integration with third-party services (e.g., external notification services).
*   **Database:**
    *   Database connection pooling (HikariCP, already default with Spring Boot).
    *   Read replicas for read-heavy workloads.
    *   Database backup and recovery strategies.
*   **DevOps:**
    *   Container orchestration with Kubernetes.
    *   Monitoring with Prometheus and Grafana.
    *   Automated security scanning (SAST, DAST).
    *   Environment-specific configurations for different deployment stages.

## 11. Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```