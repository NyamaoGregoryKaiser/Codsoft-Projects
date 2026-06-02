# Enterprise Task Management System (ETMS)

## Project Overview

The Enterprise Task Management System (ETMS) is a full-stack web application designed to facilitate task and project management within an organization. It provides functionalities for user registration, authentication, role-based authorization (Admin/User), project creation and management, and task assignment and tracking. The system is built with a focus on production readiness, scalability, and maintainability, incorporating modern DevOps practices.

## Features

### Core Features
*   **User Management**: Register, login, view, update, and delete users (Admin only).
*   **Authentication & Authorization**: JWT-based authentication with Spring Security, role-based access control.
*   **Project Management**: Create, view, update, and delete projects. Projects are associated with a creator.
*   **Task Management**: Create, view, update, and delete tasks. Tasks are linked to projects and can be assigned to users, with statuses (Open, In Progress, Review, Done, Closed) and priorities (Low, Medium, High, Urgent).
*   **RESTful API**: Clean API endpoints for all CRUD operations.

### DevOps & Quality Features
*   **Containerization**: Docker and Docker Compose for easy setup and deployment.
*   **CI/CD Pipeline**: GitHub Actions for automated build, test, and push to Docker Hub, and a conceptual deployment step.
*   **Database Migrations**: Flyway for managing database schema changes.
*   **Testing**: Unit tests, integration tests, and API tests for backend and frontend.
*   **Configuration**: Centralized `application.properties` for backend, `.env` for frontend.
*   **Logging**: Structured logging with Logback for the backend.
*   **Monitoring**: Spring Boot Actuator endpoints for health, metrics (Prometheus format), and environment info.
*   **API Documentation**: Swagger UI (Springdoc OpenAPI) for interactive API exploration.
*   **Error Handling**: Global exception handling with custom error responses.
*   **Caching**: Spring Cache with Caffeine for improved performance.
*   **Rate Limiting**: Basic per-IP rate limiting to protect API endpoints.

## Architecture

The ETMS follows a microservice-like architecture (though it's a monolith for simplicity in this example) with a clear separation of concerns:

*   **Frontend (Client)**: A React application providing the user interface.
*   **Backend (API Server)**: A Spring Boot application exposing RESTful APIs, handling business logic, data persistence, security, and other cross-cutting concerns.
*   **Database**: A PostgreSQL database for persistent storage.

```
+----------------+        +-----------------+        +---------------+
|    React UI    | <----> | Spring Boot API | <----> |  PostgreSQL   |
| (etms-frontend)|        | (etms-backend)  |        | (etms_db)     |
+----------------+        +-----------------+        +---------------+
        ^                         ^
        |                         |
        |                         v
        |                  +-----------------+
        |                  | Spring Security |
        |                  | JWT Auth/Authz  |
        |                  +-----------------+
        |
        +--------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------+
|                         Deployment Environment                  |
| +-----------------+   +---------------------+   +-------------+ |
| |   Dockerfiles   |   | docker-compose.yml  |   | GitHub Actions| |
| | (Backend/Frontend)| | (Local Orchestration) | | (CI/CD)     | |
| +-----------------+   +---------------------+   +-------------+ |
+-----------------------------------------------------------------+
```

## Setup & Running Locally

### Prerequisites

*   Java 17+
*   Node.js 18+
*   Maven 3.8+
*   npm 8+
*   Docker & Docker Compose

### 1. Clone the repository

```bash
git clone <repository_url>
cd etms-project
```

### 2. Run with Docker Compose (Recommended for local dev)

This will set up PostgreSQL, the Spring Boot backend, and the React frontend.

```bash
# Build and run all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs (e.g., for backend)
docker-compose logs -f backend
```

Once all services are up:
*   **Backend API**: `http://localhost:8080`
*   **Swagger UI**: `http://localhost:8080/swagger-ui.html`
*   **Frontend UI**: `http://localhost:3000`

To stop and remove containers:
```bash
docker-compose down
```

### 3. Run Manually (Alternative)

#### **3.1. Start PostgreSQL Database**

```bash
docker run --name etms-postgres -e POSTGRES_DB=etms_db -e POSTGRES_USER=etms_user -e POSTGRES_PASSWORD=etms_password -p 5432:5432 -d postgres:15-alpine
```
Wait for PostgreSQL to fully start (a few seconds).

#### **3.2. Run Backend**

```bash
cd etms-backend
mvn clean install
mvn spring-boot:run
```
The backend will start on `http://localhost:8080`.

#### **3.3. Run Frontend**

```bash
cd etms-frontend
npm install
npm start
```
The frontend will start on `http://localhost:3000`.

## Seed Data

The database is pre-populated with initial data via Flyway migration `V2__add_seed_data.sql`.

**Default Users**:
*   **Admin**: `username: admin`, `password: admin`
*   **User**: `username: user1`, `password: user1`
*   **User**: `username: user2`, `password: user2`

## API Endpoints (via Swagger UI)

Access the interactive API documentation at `http://localhost:8080/swagger-ui.html`.

### Authentication
*   `POST /api/auth/register` - Register a new user.
*   `POST /api/auth/login` - Authenticate and get a JWT token.

### User Management (Admin only)
*   `GET /api/users` - Get all users.
*   `GET /api/users/{id}` - Get user by ID.
*   `PUT /api/users/{id}` - Update user.
*   `DELETE /api/users/{id}` - Delete user.

### Project Management (Authenticated users)
*   `GET /api/projects` - Get all projects.
*   `GET /api/projects/{id}` - Get project by ID.
*   `POST /api/projects` - Create a new project.
*   `PUT /api/projects/{id}` - Update project.
*   `DELETE /api/projects/{id}` - Delete project (Admin only).

### Task Management (Authenticated users)
*   `GET /api/tasks` - Get all tasks.
*   `GET /api/tasks/{id}` - Get task by ID.
*   `POST /api/tasks` - Create a new task.
*   `PUT /api/tasks/{id}` - Update task.
*   `DELETE /api/tasks/{id}` - Delete task (Admin only).

## CI/CD Pipeline

The project uses **GitHub Actions** for its CI/CD pipeline, defined in `.github/workflows/main.yml`.

**Stages**:
1.  **`build-and-test`**:
    *   Checks out code.
    *   Sets up Java and Node.js environments.
    *   Builds the backend (Maven) and runs unit/integration tests.
    *   Builds the frontend (npm) and runs unit tests.
    *   Ensures code quality and test coverage.
2.  **`docker-build-and-push`**:
    *   **Triggered on `main` branch push** after `build-and-test` succeeds.
    *   Logs into Docker Hub using secrets.
    *   Builds Docker images for both backend and frontend.
    *   Pushes tagged images (`<commit_sha>` and `latest`) to Docker Hub.
3.  **`deploy`**:
    *   **Triggered on `main` branch push** after `docker-build-and-push` succeeds.
    *   This is a conceptual deployment step. In a real-world scenario, this would involve:
        *   SSHing into a production server.
        *   Connecting to a Kubernetes cluster.
        *   Using an orchestrator like AWS ECS, Azure AKS, Google GKE.
        *   Pulling the latest Docker images.
        *   Updating the application (e.g., `docker-compose up -d` or `kubectl rollout restart deployment`).
    *   Sensitive credentials for deployment (e.g., SSH keys, cloud provider tokens) are stored as GitHub Secrets.

## Testing & Quality

### Backend
*   **Unit Tests**: Located in `etms-backend/src/test/java/**/service/`, `etms-backend/src/test/java/**/repository/`. Focus on individual component logic (e.g., service methods, repository operations).
*   **Integration Tests**: Located in `etms-backend/src/test/java/**/controller/`. Use `@WebMvcTest` for controller-layer tests and `@SpringBootTest` for full application context tests (though not explicitly shown extensively for brevity).
*   **API Tests**: Integrated within controller tests using `MockMvc` and assertions for HTTP status, content, and JSON structure.
*   **Coverage**: Aim for 80%+ code coverage for backend logic, ensured by CI/CD.

### Frontend
*   **Unit Tests**: Located in `etms-frontend/src/**/*.test.js`. Uses React Testing Library and Jest to test individual components and utility functions.

### Performance Tests
*   A conceptual `k6` script (`performance-tests/api-load-test.js`) is provided to demonstrate API load testing. This would typically be run against a staging environment.

## Logging and Monitoring

### Logging
*   Backend uses SLF4J with Logback. Configuration in `etms-backend/src/main/resources/logback-spring.xml`.
*   Logs are output to console and a rolling file (`logs/etms-backend.log`).
*   SQL queries and their parameters are logged at `DEBUG`/`TRACE` level.

### Monitoring
*   Spring Boot Actuator endpoints are exposed (e.g., `/actuator/health`, `/actuator/info`, `/actuator/prometheus`). These are secured and accessible only by ADMIN role.
*   Prometheus metrics can be scraped from `/actuator/prometheus`.

## Future Enhancements

*   **OAuth2/OIDC Integration**: Replace custom JWT with a standard like Keycloak or Okta.
*   **Advanced Caching**: Implement a distributed cache (e.g., Redis) for multi-instance deployments.
*   **Full-text Search**: Integrate Elasticsearch for searching tasks and projects.
*   **Notifications**: Add real-time notifications for task assignments/updates.
*   **File Uploads**: Allow attaching files to tasks or projects.
*   **Container Orchestration**: Deploy to Kubernetes or AWS ECS for production.
*   **Observability**: Integrate with a complete observability stack (Prometheus, Grafana, Loki/ELK, Jaeger).
*   **Frontend UI/UX**: Further refine the React application with more features, better accessibility, and responsive design.
*   **Database Scaling**: Implement read replicas or sharding if needed.
*   **API Gateway**: Introduce an API Gateway for advanced routing, security, and rate limiting.
*   **More comprehensive test coverage**: Expand unit, integration, and E2E tests for both frontend and backend.
*   **Error Reporting**: Integrate with Sentry or similar error tracking tools.
*   **Secrets Management**: Use a dedicated secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager) instead of environment variables.