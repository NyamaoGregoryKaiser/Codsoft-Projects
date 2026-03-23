```markdown
# TaskSync Pro: Enterprise-Grade Task Management System with Comprehensive Performance Monitoring

TaskSync Pro is a full-stack web application for managing projects and tasks. It's built with a focus on enterprise readiness, featuring robust security, data persistence, and a comprehensive monitoring stack to ensure high availability and performance.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Setup Guide](#setup-guide)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup](#local-development-setup)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
5.  [API Documentation](#api-documentation)
6.  [Monitoring & Observability](#monitoring--observability)
7.  [Testing](#testing)
8.  [CI/CD](#ci-cd)
9.  [Deployment Guide](#deployment-guide)
10. [Contributing](#contributing)
11. [License](#license)

---

## 1. Features

*   **User Management:** Register, log in, view, update, and delete user profiles. Role-based access control (USER, ADMIN).
*   **Project Management:** Create, view, update, and delete projects. Assign project owners and members.
*   **Task Management:** Create, view, update, and delete tasks. Assign tasks to projects and users, update task status (TODO, IN_PROGRESS, DONE, BLOCKED).
*   **Authentication & Authorization:** Secure JWT-based authentication and Spring Security for role-based access.
*   **Data Persistence:** PostgreSQL database with Flyway for schema migrations.
*   **Caching:** In-memory caching (Caffeine) for frequently accessed data to improve response times.
*   **Rate Limiting:** Protects API endpoints from abuse and ensures fair usage.
*   **Global Error Handling:** Consistent API error responses.
*   **Comprehensive Monitoring:**
    *   **Metrics:** Prometheus & Grafana for application health, performance (HTTP request latency, error rates, custom business metrics, JVM metrics, database connection pool metrics).
    *   **Distributed Tracing:** OpenTelemetry & Jaeger for visualizing request flows across services and identifying bottlenecks.
    *   **Centralized Logging:** ELK Stack (Elasticsearch, Logstash, Kibana) for structured log aggregation, search, and analysis.
*   **Testing:** Unit, Integration, and API tests with high coverage. Performance testing with JMeter.
*   **Containerization:** Docker for easy setup and deployment.
*   **CI/CD:** Automated build, test, and deployment pipeline using GitHub Actions.

---

## 2. Architecture

The system follows a layered architecture with a clear separation of concerns, suitable for microservices evolution.

```
+----------------+       +-------------------+       +-------------------+
|                |       |  TaskSync Pro     |       |                   |
|    Frontend    | ----> |  Backend (Java)   | ----> |   PostgreSQL      |
|    (ReactJS)   |       | (Spring Boot)     |       |   (Database)      |
|                |       |                   |       |                   |
+----------------+       +-------------------+       +-------------------+
                                   |
                                   | Metrics (Micrometer)
                                   | Traces (OpenTelemetry Agent)
                                   | Logs (Logback/Logstash)
                                   V
+----------------+       +-------------------+       +-------------------+
|                |       |                   |       |                   |
|    Prometheus  |<------|    Grafana        |       |     Jaeger        |
|  (Metrics Scraper)     |  (Dashboard)      |<------| (Trace Storage)   |
|                |       |                   |       |                   |
+----------------+       +-------------------+       +-------------------+
                                   ^
                                   | Logs
                                   |
+----------------+       +-------------------+       +-------------------+
|                |       |                   |       |                   |
|   Logstash     |-----> |   Elasticsearch   |-----> |      Kibana       |
| (Log Ingestion)|       | (Log Storage)     |       | (Log Visualization)|
|                |       |                   |       |                   |
+----------------+       +-------------------+       +-------------------+
```

### Backend Microservices (Conceptual/Simulated)

While implemented as a single Spring Boot application for simplicity in this comprehensive example, the package structure (`controller`, `service`, `repository` for users, projects, tasks) is designed to facilitate future decomposition into separate microservices (`user-service`, `project-service`, `task-service`). The monitoring and tracing setup is already suitable for distributed systems.

---

## 3. Technology Stack

*   **Backend:**
    *   Java 17
    *   Spring Boot 3.x
    *   Spring Data JPA (Hibernate)
    *   Spring Security (JWT)
    *   Lombok
    *   Flyway (Database Migrations)
    *   Caffeine (Caching)
    *   Guava (Rate Limiting)
    *   Micrometer (Metrics)
    *   OpenTelemetry (Tracing)
    *   Logback + Logstash Encoder (Logging)
    *   Swagger/OpenAPI (API Documentation)
*   **Frontend:**
    *   ReactJS
    *   Axios (HTTP Client)
    *   React Router (Navigation)
*   **Database:**
    *   PostgreSQL
*   **Monitoring & Observability:**
    *   Prometheus (Metrics Collection)
    *   Grafana (Metrics Visualization, Dashboards)
    *   Jaeger (Distributed Tracing)
    *   Elasticsearch (Log Storage)
    *   Logstash (Log Ingestion & Processing)
    *   Kibana (Log Visualization & Analysis)
*   **DevOps & Tools:**
    *   Docker & Docker Compose
    *   Maven (Build Tool)
    *   JUnit 5, Mockito, Testcontainers, RestAssured (Testing)
    *   JMeter (Performance Testing)
    *   GitHub Actions (CI/CD)

---

## 4. Setup Guide

### Prerequisites

*   Git
*   Java Development Kit (JDK) 17 or higher
*   Maven 3.8.x or higher
*   Node.js 20.x or higher
*   npm 10.x or higher
*   Docker Desktop (includes Docker Engine and Docker Compose)
*   (Optional for performance tests) Apache JMeter

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/tasksync-pro.git
    cd tasksync-pro
    ```

2.  **Download OpenTelemetry Java Agent:**
    The `docker-compose.yml` expects the OpenTelemetry Java Agent JAR to be in the root directory. Download it:
    ```bash
    wget https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
    ```

3.  **Start the entire stack with Docker Compose:**
    This will build the `app` (backend) and `frontend` images, pull other services (PostgreSQL, Prometheus, Grafana, Jaeger, ELK), and start them.
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds service images (useful when you change code).
    *   `-d`: Runs containers in detached mode.

    Wait a few minutes for all services to initialize (especially Elasticsearch and the Spring Boot app). You can check logs with `docker-compose logs -f`.

4.  **Verify services are running:**
    *   **Backend API:** `http://localhost:8080` (or `http://localhost:8080/actuator/health`)
    *   **Swagger UI:** `http://localhost:8080/swagger-ui.html`
    *   **Frontend UI:** `http://localhost:3000` (React dev server, if not using Nginx proxy, else through Nginx)
    *   **Prometheus UI:** `http://localhost:9090`
    *   **Grafana UI:** `http://localhost:3001` (Default login: admin/admin)
    *   **Jaeger UI:** `http://localhost:16686`
    *   **Kibana UI:** `http://localhost:5601`

### Backend Setup (Manual, if not using Docker Compose)

1.  **Database:** Install PostgreSQL and create a database `tasksyncpro_db` with user `tasksyncpro_user` and password `tasksyncpro_password`.
2.  **Configuration:** Update `backend/src/main/resources/application.yml` with your database credentials.
3.  **Build:**
    ```bash
    cd backend
    ./mvnw clean install
    ```
4.  **Run:**
    ```bash
    java -jar target/tasksyncpro-0.0.1-SNAPSHOT.jar
    # To run with OpenTelemetry agent directly:
    # java -javaagent:/path/to/opentelemetry-javaagent.jar -Dotel.service.name=tasksync-pro-backend -Dotel.exporter.otlp.endpoint=http://localhost:4317 -jar target/tasksyncpro-0.0.1-SNAPSHOT.jar
    ```

### Frontend Setup (Manual, if not using Docker Compose)

1.  **Install dependencies:**
    ```bash
    cd frontend
    npm install
    ```
2.  **Start development server:**
    ```bash
    npm start
    ```
    The app will open in your browser at `http://localhost:3000`. It's configured to proxy API requests to `http://localhost:8080/api`.

---

## 5. API Documentation

The backend API is documented using Springdoc OpenAPI (Swagger UI).

Access the interactive API documentation at: `http://localhost:8080/swagger-ui.html`

**Key Endpoints:**

*   **Authentication:**
    *   `POST /api/auth/register`: Register a new user.
    *   `POST /api/auth/login`: Authenticate and get a JWT token.
*   **Users (Admin or Owner Only):**
    *   `GET /api/users/{id}`: Get user by ID.
    *   `GET /api/users`: Get all users (Admin only).
    *   `PUT /api/users/{id}`: Update user.
    *   `DELETE /api/users/{id}`: Delete user.
*   **Projects (Authenticated Users):**
    *   `POST /api/projects`: Create a new project.
    *   `GET /api/projects/{id}`: Get project by ID (Owner/Member only).
    *   `GET /api/projects/my-projects`: Get projects owned by the current user.
    *   `GET /api/projects`: Get all projects (Admin only).
    *   `PUT /api/projects/{id}`: Update project (Owner only).
    *   `DELETE /api/projects/{id}`: Delete project (Owner only).
*   **Tasks (Authenticated Users):**
    *   `POST /api/tasks`: Create a new task (Project Member only).
    *   `GET /api/tasks/{id}`: Get task by ID (Project Member only).
    *   `GET /api/tasks/project/{projectId}`: Get tasks for a project (Project Member only).
    *   `GET /api/tasks/assigned-to/{userId}`: Get tasks assigned to a user (Admin or Owner only).
    *   `GET /api/tasks`: Get all tasks (Admin only).
    *   `PUT /api/tasks/{id}`: Update task (Project Member only).
    *   `DELETE /api/tasks/{id}`: Delete task (Project Member only).

---

## 6. Monitoring & Observability

The system is instrumented with a full suite of observability tools:

*   **Prometheus (Metrics):**
    *   **Access:** `http://localhost:9090`
    *   **Purpose:** Collects time-series data (metrics) from the Spring Boot application's `/actuator/prometheus` endpoint.
    *   **Key Metrics:**
        *   `http_server_requests_seconds_count`, `_sum`, `_max`: HTTP request duration and count.
        *   `jvm_memory_used_bytes`, `jvm_threads_current_threads`: JVM health.
        *   `hikaricp_connections_active`: Database connection pool usage.
        *   `app_users_registered_total`, `app_projects_created_total`, `app_tasks_created_total`: Custom business metrics.
        *   `app_api_rate_limit_exceeded_total`: Rate limiting occurrences.
        *   `app_method_duration_seconds_sum`, `_count`: Performance of specific methods (via `@MonitorPerformance` aspect).
        *   `cache_gets_total`, `cache_misses_total`: Cache performance.

*   **Grafana (Dashboards):**
    *   **Access:** `http://localhost:3001` (Login: `admin` / `admin`)
    *   **Purpose:** Visualizes metrics from Prometheus, providing dashboards for system health, application performance, and business insights.
    *   **Setup:** Pre-configured with Prometheus, Jaeger, and Elasticsearch datasources via provisioning. You would typically import a custom dashboard JSON (e.g., `tasksyncpro-dashboard.json`) for a full overview.

*   **Jaeger (Distributed Tracing):**
    *   **Access:** `http://localhost:16686`
    *   **Purpose:** Provides end-to-end visibility into request flows. The OpenTelemetry Java Agent automatically instruments Spring Boot, JDBC, and other common libraries, sending traces to Jaeger.
    *   **Usage:** Search for traces by service name (`tasksync-pro-backend`), operation name (e.g., HTTP endpoint, method name), or trace ID (which can be found in logs). This helps identify latency hot-spots in complex operations.

*   **ELK Stack (Centralized Logging):**
    *   **Kibana Access:** `http://localhost:5601`
    *   **Purpose:** Aggregates, indexes, and visualizes structured logs from the Spring Boot application.
    *   **Flow:**
        1.  **Logback:** The Spring Boot application uses `logback-spring.xml` with `logstash-logback-encoder` to format logs as JSON.
        2.  **Logstash:** Listens on `tcp:5000` for these JSON logs, processes them (e.g., enriches with OpenTelemetry trace/span IDs), and sends them to Elasticsearch.
        3.  **Elasticsearch:** Stores the indexed JSON logs.
        4.  **Kibana:** Provides a powerful UI to search, filter, and visualize logs (e.g., error rates, specific trace IDs, user activity).
    *   **Usage:** In Kibana, configure an index pattern (e.g., `logstash-*`), then go to "Discover" to explore logs. You can filter by `log.level`, `service.name`, `trace.id`, `span.id`, etc.

---

## 7. Testing

The project emphasizes high-quality code through comprehensive testing:

*   **Unit Tests:**
    *   **Framework:** JUnit 5, Mockito
    *   **Location:** `backend/src/test/java/com/tasksyncpro/tasksyncpro/service/`
    *   **Coverage Target:** Aim for 80%+ line coverage. Tests cover individual service methods, business logic, and error scenarios.
*   **Integration Tests:**
    *   **Framework:** Spring Boot Test, Testcontainers
    *   **Location:** `backend/src/test/java/com/tasksyncpro/tasksyncpro/repository/`
    *   **Purpose:** Verify interaction with the real PostgreSQL database using disposable Testcontainers instances.
*   **API Tests:**
    *   **Framework:** RestAssured, Spring Boot Test
    *   **Location:** `backend/src/test/java/com/tasksyncpro/tasksyncpro/controller/`
    *   **Purpose:** Test API endpoints end-to-end, simulating HTTP requests and validating responses.
*   **Performance Tests:**
    *   **Tool:** Apache JMeter
    *   **Location:** `jmeter/login-performance-test.jmx`
    *   **Purpose:** Simulate concurrent user load on critical API endpoints (e.g., login) to measure response times, throughput, and error rates under stress.

**How to run tests:**

*   **Backend:**
    ```bash
    cd backend
    ./mvnw clean verify
    ```
    This will run unit tests, integration tests, and generate a JaCoCo coverage report in `backend/target/site/jacoco/index.html`.
*   **Frontend:**
    ```bash
    cd frontend
    npm test
    ```
    This runs Jest tests.

---

## 8. CI/CD

A basic CI/CD pipeline is configured using GitHub Actions (`.github/workflows/ci-cd.yml`).

**Pipeline Stages:**

1.  **`build-and-test-backend`**:
    *   Checks out code.
    *   Sets up Java 17.
    *   Starts a PostgreSQL container using Testcontainers for integration tests.
    *   Builds the backend and runs all unit & integration tests.
    *   Uploads JaCoCo coverage report as an artifact.
2.  **`build-and-test-frontend`**:
    *   Checks out code.
    *   Sets up Node.js.
    *   Installs frontend dependencies.
    *   Runs frontend unit tests (Jest) with coverage.
    *   Builds the frontend for production.
    *   Uploads the frontend build artifact.
3.  **`docker-build-and-push`**:
    *   **Dependency:** Requires `build-and-test-backend` and `build-and-test-frontend` to pass.
    *   **Condition:** Runs only on pushes to the `main` branch.
    *   Downloads OpenTelemetry agent.
    *   Logs into Docker Hub using secrets.
    *   Builds and pushes Docker images for both backend (`tasksyncpro-backend:latest`) and frontend (`tasksyncpro-frontend:latest`) to Docker Hub.
4.  **`deploy`**:
    *   **Dependency:** Requires `docker-build-and-push` to complete successfully.
    *   **Condition:** Runs only on pushes to the `main` branch.
    *   **Runner:** Assumes a `self-hosted` runner is set up on your deployment server.
    *   Logs into Docker Hub.
    *   Pulls the latest backend and frontend Docker images.
    *   Stops existing Docker Compose services.
    *   Copies updated Docker Compose files and configurations to the deployment location.
    *   Starts the entire stack using `docker-compose up -d`.

**GitHub Secrets Required:**

*   `DOCKER_USERNAME`: Your Docker Hub username.
*   `DOCKER_PASSWORD`: Your Docker Hub access token or password.

---

## 9. Deployment Guide

The `deploy` stage of the CI/CD pipeline provides a high-level overview. For manual deployment or a more detailed guide:

1.  **Prepare your Production Server:**
    *   Install Docker and Docker Compose.
    *   Ensure necessary ports (80, 443 for frontend, 8080 for backend, 9090 for Prometheus, 3001 for Grafana, 16686 for Jaeger, 5601 for Kibana) are open in your firewall and not blocked.
    *   Set up Nginx as a reverse proxy for the frontend if you intend to serve it on port 80/443 and handle SSL. The `frontend/nginx/nginx.conf` is an example.

2.  **Copy Files:**
    Copy the following files/directories to your production server in a dedicated project directory (e.g., `/opt/tasksyncpro`):
    *   `docker-compose.yml`
    *   `opentelemetry-javaagent.jar`
    *   `prometheus/` directory
    *   `grafana/` directory
    *   `logstash/` directory
    *   `init-db.sh` (if you prefer to run it manually)

3.  **Environment Variables:**
    Set required environment variables (especially `JWT_SECRET_KEY`) on your server. For `docker-compose.yml`, you can use an `.env` file in the same directory as `docker-compose.yml` (e.g., `JWT_SECRET_KEY=your_super_secret_key_here`).

4.  **Run Docker Compose:**
    Navigate to your project directory on the server and run:
    ```bash
    docker-compose pull # Pull the latest images from Docker Hub
    docker-compose up -d
    ```

5.  **Monitor Logs:**
    Check the logs to ensure all services start correctly:
    ```bash
    docker-compose logs -f
    ```

6.  **Access Services:**
    Access the application and monitoring dashboards using the URLs mentioned in the [Local Development Setup](#local-development-setup) section, replacing `localhost` with your server's IP address or domain name.

---

## 10. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write comprehensive tests for your changes.
5.  Ensure all tests pass and code coverage is maintained.
6.  Commit your changes (`git commit -m 'feat: Add new feature'`).
7.  Push to the branch (`git push origin feature/your-feature-name`).
8.  Create a Pull Request.

---

## 11. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```