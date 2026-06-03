```markdown
# TaskFlow - Comprehensive Performance Monitoring System

`TaskFlow` is a full-stack, enterprise-grade task management application built with Spring Boot (Java) for the backend and React (TypeScript) for the frontend. This project demonstrates a comprehensive approach to building a production-ready application, with a strong focus on performance monitoring, observability, and quality assurance.

The system integrates:
*   **Backend:** Spring Boot, Spring Security (JWT), Spring Data JPA, PostgreSQL, Flyway, Caffeine Cache, Micrometer (Prometheus), Spring Cloud Sleuth (Jaeger).
*   **Frontend:** React, TypeScript, Tailwind CSS, React Router, Axios.
*   **Monitoring:** Prometheus, Grafana, Jaeger.
*   **Containerization:** Docker, Docker Compose.
*   **CI/CD:** GitHub Actions.
*   **Testing:** Unit, Integration, and Performance (JMeter).

## Features

**Core Application (TaskFlow):**
*   **User Management:** Register, Login, Authentication (JWT).
*   **Project Management:** CRUD operations for projects, associated with an owner.
*   **Task Management:** CRUD operations for tasks, assigned to projects and users, with status and priority.
*   **Authorization:** Role-based access control (`ROLE_USER`, `ROLE_ADMIN`) and resource-based authorization (e.g., only project owner can modify a project).
*   **Error Handling:** Global exception handling with structured error responses.
*   **Logging:** Structured JSON logging with `logback-spring.xml` including tracing IDs (from Sleuth).
*   **Caching:** Caffeine-based caching for service layer methods (e.g., fetching projects/tasks by ID).
*   **Rate Limiting:** Custom interceptor to prevent API abuse.

**Performance Monitoring & Observability:**
*   **Metrics:** Micrometer integrated with Spring Boot Actuator exposes application metrics to Prometheus (RPS, latency, CPU, memory, thread usage, custom method performance/error metrics).
*   **Distributed Tracing:** Spring Cloud Sleuth automatically adds `traceId` and `spanId` to logs and sends traces to Jaeger, enabling visualization of request flow across services.
*   **Dashboarding:** Grafana pre-configured with a dashboard to visualize key backend performance metrics from Prometheus.
*   **Structured Logging:** Logback configured to output JSON logs, ideal for ingestion by tools like ELK (Elasticsearch, Logstash, Kibana) or Splunk.

**Quality & Development Practices:**
*   **Database Migrations:** Flyway for version-controlled database schema management.
*   **API Documentation:** SpringDoc OpenAPI (Swagger UI) for interactive API exploration.
*   **Unit Tests:** Extensive unit tests for service layers with Mockito.
*   **Integration Tests:** Database-backed integration tests using Testcontainers.
*   **Performance Tests:** Apache JMeter test plan for load testing the backend APIs.
*   **Code Quality:** Spotless for consistent code formatting.
*   **CI/CD:** Basic GitHub Actions workflow for automated build and test.

## Architecture

The architecture follows a modular monolithic approach, deployed as multiple Docker containers orchestrated by `docker-compose`.

```mermaid
graph TD
    User(Browser/Client) -->|HTTP/S| Frontend(React Frontend: Nginx)
    Frontend -->|HTTP/S API Calls| Backend(Spring Boot Backend)

    subgraph Backend Services
        Backend --> DB(PostgreSQL Database)
        Backend -->|Metrics| Prometheus(Prometheus: Metrics Storage)
        Backend -->|Traces| Jaeger(Jaeger: Distributed Tracing)
        Backend -->|Logs (console/file)| Logging(Structured Logback Output)
    end

    subgraph Monitoring & Observability
        Prometheus --> Grafana(Grafana: Visualization)
        Jaeger --> JaegerUI(Jaeger UI: Trace Visualization)
    end

    subgraph Development Tools
        JMeter(JMeter: Performance Testing) --> Backend
        GitHubActions(GitHub Actions: CI/CD) --> Backend
    end

    style Backend fill:#a2e0c0,stroke:#3c3,stroke-width:2px
    style Frontend fill:#c0e0e0,stroke:#69c,stroke-width:2px
    style DB fill:#e0c0a0,stroke:#963,stroke-width:2px
    style Prometheus fill:#ffcc00,stroke:#cc9900,stroke-width:2px
    style Grafana fill:#66ccff,stroke:#3399cc,stroke-width:2px
    style Jaeger fill:#a0a0ff,stroke:#6666cc,stroke-width:2px
    style User fill:#ffffff,stroke:#333,stroke-width:1px
    style JMeter fill:#e6e6e6,stroke:#888,stroke-width:1px
    style GitHubActions fill:#b0b0b0,stroke:#666,stroke-width:1px
```

*   **Frontend (React/Nginx):** A single-page application served by an Nginx container. It interacts with the Spring Boot backend via REST APIs.
*   **Backend (Spring Boot):** The core business logic, API endpoints, authentication, and persistence layer. It exposes Prometheus metrics via `/actuator/prometheus` and sends traces to Jaeger.
*   **PostgreSQL:** The primary relational database for storing application data.
*   **Prometheus:** Scrapes metrics from the Spring Boot application (and potentially other services) at regular intervals.
*   **Grafana:** Queries Prometheus for metrics and visualizes them on dashboards, providing a real-time view of application health and performance.
*   **Jaeger:** Collects distributed traces from the Spring Boot application (via Spring Cloud Sleuth) to visualize end-to-end request flows and identify latency bottlenecks.

## Setup and Run

### Prerequisites

*   Docker and Docker Compose
*   Java 17+ (if running backend locally without Docker)
*   Node.js 18+ and npm/yarn (if running frontend locally without Docker)
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/taskflow-performance-monitoring.git
cd taskflow-performance-monitoring
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory of the project, based on `.env.example`.

```bash
cp .env.example .env
```
Edit `.env` as needed. The defaults are usually fine for local development.

### 3. Build and Run with Docker Compose

Navigate to the root directory of the project (`taskflow-performance-monitoring/`) and run:

```bash
docker-compose up --build -d
```

This command will:
*   Build the `backend` Docker image (Spring Boot app).
*   Build the `frontend` Docker image (React app served by Nginx).
*   Pull images for `postgres`, `prometheus`, `grafana`, `jaeger`.
*   Start all services and link them via a Docker network.
*   `--build`: Rebuilds images if Dockerfiles or context change.
*   `-d`: Runs containers in detached mode (in the background).

Wait a few minutes for all services to initialize, especially the backend which needs to run Flyway migrations.

### 4. Access the Applications

Once all services are up:

*   **TaskFlow Frontend:** `http://localhost:3000`
    *   Default Admin: `username: admin`, `password: password`
    *   Default User: `username: john.doe`, `password: password`
    *   You can also register new users via the UI.
*   **TaskFlow Backend API (Swagger UI):** `http://localhost:8080/swagger-ui.html`
*   **Prometheus UI:** `http://localhost:9090`
*   **Grafana UI:** `http://localhost:3001` (Default login: `admin`/`admin` - configurable in `.env`)
    *   The `TaskFlow Backend Performance Dashboard` should be automatically provisioned.
*   **Jaeger UI:** `http://localhost:16686`

### 5. Stop and Clean Up

To stop the running containers:

```bash
docker-compose down
```

To stop and remove containers, networks, and volumes (database data, Prometheus data, Grafana data will be lost):

```bash
docker-compose down -v
```

## Local Development (without Docker Compose for App services)

You can run the backend and frontend locally outside of Docker Compose while still using the Dockerized database and monitoring tools.

1.  **Start Database and Monitoring Services:**
    ```bash
    docker-compose up -d postgres prometheus grafana jaeger
    ```

2.  **Run Backend Locally:**
    Navigate to `backend/`
    ```bash
    ./gradlew bootRun
    ```
    The backend will start on `http://localhost:8080`. It will connect to the `postgres` service via `localhost:5432`.
    *Ensure your `application.yml` `DB_HOST` is set to `localhost` if running locally, or pass it as an environment variable `DB_HOST=localhost`.*

3.  **Run Frontend Locally:**
    Navigate to `frontend/`
    ```bash
    npm install
    npm start
    ```
    The frontend will start on `http://localhost:3000`. It will attempt to connect to the backend at `http://localhost:8080/api` (configured in `frontend/.env.development` or `REACT_APP_API_BASE_URL`).

## Testing

### Unit Tests (Backend)

Run backend unit tests:
```bash
cd backend
./gradlew test
```
*   **Coverage:** Aim for 80%+ line coverage. The provided tests cover core service logic.
*   **Report:** HTML test reports and JaCoCo coverage reports are generated under `backend/build/reports/tests/test/` and `backend/build/reports/jacoco/test/html/`.

### Integration Tests (Backend)

The `ProjectControllerIntegrationTest` uses `Testcontainers` to spin up a real PostgreSQL database for integration testing. This ensures that the application's database interactions work correctly.

These are included in `./gradlew test`.

### API Tests (cURL / Postman)

You can use the provided Swagger UI (`http://localhost:8080/swagger-ui.html`) for interactive API testing.

Here are some `curl` examples:

1.  **Register a new user:**
    ```bash
    curl -X POST "http://localhost:8080/api/auth/register" \
         -H "Content-Type: application/json" \
         -d '{ "username": "testuser", "email": "test@example.com", "password": "password123" }'
    ```

2.  **Login and get JWT token:**
    ```bash
    curl -X POST "http://localhost:8080/api/auth/login" \
         -H "Content-Type: application/json" \
         -d '{ "username": "testuser", "password": "password123" }'
    # Copy the "token" value from the response for subsequent authenticated requests
    ```

3.  **Create a Project (replace `YOUR_JWT_TOKEN` and ensure `testuser` is logged in):**
    ```bash
    curl -X POST "http://localhost:8080/api/projects" \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer YOUR_JWT_TOKEN" \
         -d '{ "name": "My First Project", "description": "A project created via API." }'
    ```

4.  **Get My Projects (replace `YOUR_JWT_TOKEN`):**
    ```bash
    curl -X GET "http://localhost:8080/api/projects/my-projects" \
         -H "Authorization: Bearer YOUR_JWT_TOKEN"
    ```

### Performance Tests (JMeter)

1.  **Install JMeter:** Download and install Apache JMeter from their official website if you don't have it.
2.  **Open Test Plan:** Open the `jmeter/TaskFlow_Performance_Test.jmx` file in JMeter.
3.  **Configure:** The test plan includes User Defined Variables (`BASE_URL`, `PORT`, `USERS`, `RAMP_UP`, `DURATION`).
    *   If running with `