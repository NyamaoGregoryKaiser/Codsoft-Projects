```markdown
# ML Utilities System

A comprehensive, production-ready Machine Learning utilities system designed for managing, deploying, and serving ML models, along with providing data preprocessing capabilities. Built with Java (Spring Boot), PostgreSQL, Docker, and secured with JWT authentication.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup and Local Development](#setup-and-local-development)
  - [Prerequisites](#prerequisites)
  - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
  - [Manual Setup](#manual-setup)
- [API Documentation (Swagger UI)](#api-documentation-swagger-ui)
- [Authentication](#authentication)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [CI/CD](#ci-cd)
- [Deployment](#deployment)
- [Frontend Integration](#frontend-integration)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Features

*   **Model Management:**
    *   Register and track ML models (e.g., "Customer Churn Prediction").
    *   Version control for models, allowing multiple iterations.
    *   Activate/deactivate specific model versions for inference.
    *   CRUD operations for models and model versions.
*   **Prediction Service:**
    *   Serve predictions from the currently active model version.
    *   Log all prediction requests and responses for auditing and monitoring.
    *   Support for flexible JSON input/output.
*   **Data Preprocessing:**
    *   Utility endpoints for common data transformations (e.g., Min-Max Scaling, One-Hot Encoding, Text Vectorization).
*   **Authentication & Authorization:**
    *   JWT-based authentication for secure API access.
    *   Role-Based Access Control (RBAC) with `ROLE_ADMIN` and `ROLE_USER`.
*   **API Management:**
    *   RESTful API design.
    *   OpenAPI (Swagger UI) for interactive API documentation.
    *   Rate limiting to protect against abuse.
*   **Robustness & Scalability:**
    *   Centralized error handling.
    *   Logging and monitoring with Spring Boot Actuator.
    *   Caching layer (Caffeine) for improved performance of model metadata.
*   **Database:**
    *   PostgreSQL for persistent data storage.
    *   Flyway for database schema migrations.
*   **Containerization:**
    *   Docker and Docker Compose for easy setup and deployment.
*   **CI/CD:**
    *   GitHub Actions workflow for automated build, test, and Docker image publishing.

## Architecture

The system follows a typical layered architecture for a Spring Boot application:

*   **Controllers:** Handle incoming HTTP requests, validate input, and delegate to services.
*   **Services:** Contain the core business logic, orchestrate data operations, and interact with repositories.
*   **Repositories:** Interact with the database using Spring Data JPA.
*   **Entities:** Represent the domain models and map to database tables.
*   **DTOs:** Data Transfer Objects for clean data exchange between layers and API.
*   **Security Layer:** Intercepts requests for authentication and authorization (JWT, Spring Security).
*   **Cross-Cutting Concerns:** Global exception handling, logging, caching, rate limiting.

For a more detailed architecture, refer to [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech Stack

*   **Backend:** Java 17, Spring Boot 3
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA, Hibernate
*   **Security:** Spring Security, JWT (jjwt)
*   **API Docs:** SpringDoc OpenAPI (Swagger UI)
*   **Build Tool:** Apache Maven
*   **Database Migration:** Flyway
*   **Caching:** Caffeine
*   **Rate Limiting:** Google Guava RateLimiter
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers, RestAssured
*   **Serialization:** Jackson (built-in with Spring Web)

## Setup and Local Development

### Prerequisites

*   Java 17 JDK
*   Apache Maven 3.6+
*   Docker and Docker Compose (recommended)
*   (Optional) PostgreSQL client if not using Docker Compose

### Using Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system
    ```

2.  **Build the Spring Boot JAR:**
    ```bash
    mvn clean install -DskipTests
    ```
    This will create `target/ml-utilities-system-0.0.1-SNAPSHOT.jar`.

3.  **Update `JWT_SECRET` in `docker-compose.yml`:**
    Change `YOUR_SECURE_JWT_SECRET_KEY_THAT_IS_AT_LEAST_256_BITS_LONG_COMPOSE` to a strong, random 256-bit (or longer) base64 encoded string. You can generate one with:
    ```bash
    openssl rand -base64 32
    ```

4.  **Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the Docker image for the Spring Boot application.
    *   Start a PostgreSQL container.
    *   Start the Spring Boot application, connected to the PostgreSQL database.
    *   Run Flyway migrations on startup to set up the database schema and seed initial data.

5.  **Verify services:**
    Check container status:
    ```bash
    docker-compose ps
    ```
    Wait for the `app` service to show `(healthy)` in the `Status` column. This might take a minute or two for the database to start and migrations to run.

The application will be accessible at `http://localhost:8080`.

### Manual Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system
    ```

2.  **Set up PostgreSQL:**
    *   Ensure a PostgreSQL instance is running.
    *   Create a database (e.g., `ml_util_db`).
    *   Create a user (e.g., `mluser`) with password (e.g., `mlpassword`) and grant privileges to the database.

3.  **Configure `application.yml`:**
    *   Update `src/main/resources/application.yml` with your PostgreSQL connection details, or set environment variables:
        ```bash
        export DB_HOST=localhost
        export DB_PORT=5432
        export DB_NAME=ml_util_db
        export DB_USERNAME=mluser
        export DB_PASSWORD=mlpassword
        export JWT_SECRET=<YOUR_SECURE_JWT_SECRET_KEY>
        ```
    *   For local development, you might uncomment the `spring.h2` section in `application-dev.yml` and activate the `dev` profile to use an in-memory database, bypassing the need for an external PostgreSQL setup.

4.  **Build and Run the application:**
    ```bash
    mvn clean install
    java -jar target/ml-utilities-system-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
    # Or for dev profile with H2 (if configured):
    # java -jar target/ml-utilities-system-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
    ```

## API Documentation (Swagger UI)

Once the application is running, you can access the interactive API documentation (Swagger UI) at:
[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

This interface allows you to explore endpoints, their request/response schemas, and even try out API calls directly.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

1.  **Register a user:**
    *   Endpoint: `POST /api/auth/signup`
    *   Body: `{"name": "...", "username": "...", "email": "...", "password": "..."}`
    *   The `V2__Add_Seed_Data.sql` migration script provides default users:
        *   **Admin:** `username: admin`, `password: admin123`
        *   **User:** `username: user`, `password: user123`

2.  **Login to get a JWT token:**
    *   Endpoint: `POST /api/auth/signin`
    *   Body: `{"usernameOrEmail": "admin", "password": "admin123"}`
    *   The response will contain an `accessToken`.

3.  **Authorize API calls:**
    *   In Swagger UI, click the "Authorize" button and enter your JWT token in the format `Bearer <YOUR_ACCESS_TOKEN>`.
    *   For other API clients, include the `Authorization` header with the value `Bearer <YOUR_ACCESS_TOKEN>` in your requests.

## Testing

The project includes:

*   **Unit Tests:** Located in `src/test/java/com/mlutil/...`. These focus on individual components (services, repositories, utilities) using Mockito for dependencies. Target coverage is 80%+.
*   **Integration Tests:** Also in `src/test/java/com/mlutil/...`. These test interactions between multiple components, including the database, using Spring Boot Test and Testcontainers for a real PostgreSQL instance. RestAssured is used for API testing.
*   **API Tests:** Covered as part of Integration Tests using RestAssured.
*   **Performance Tests:** Not included in the codebase (as they require external tools). Refer to the [DEPLOYMENT.md](DEPLOYMENT.md) for strategy.

To run all tests:
```bash
mvn test
```
To run tests with coverage report (requires JaCoCo plugin in `pom.xml`):
```bash
mvn clean verify
```
The JaCoCo report will be generated in `target/site/jacoco/index.html`.

## Monitoring

*   **Logging:** Configured with Logback, outputting to console and rolling files (`logs/ml-utilities-system-info.log`, `logs/ml-utilities-system-error.log`).
*   **Spring Boot Actuator:** Provides endpoints for health, metrics, environment info, etc.
    *   Health check: `http://localhost:8080/actuator/health`
    *   Metrics (Prometheus format): `http://localhost:8080/actuator/prometheus` (Integrate with Prometheus/Grafana for visualization).
*   **Error Handling:** Custom global exception handler for consistent error responses.

## CI/CD

A basic GitHub Actions pipeline is configured in `.github/workflows/main.yml`. It performs the following steps:

1.  **Build & Test:** On push/pull request to `main` or `develop` branches:
    *   Checks out code.
    *   Sets up Java 17.
    *   Builds the project with Maven, runs all unit and integration tests.
    *   Uploads JaCoCo coverage report as an artifact.
2.  **Build & Push Docker Image:** On push to `main` or `develop` (after `build-and-test` succeeds):
    *   Builds the Spring Boot JAR (skipping tests as they ran in the previous step).
    *   Logs into Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets).
    *   Builds and pushes the Docker image to Docker Hub, tagging it with `latest` (for `main` branch), short SHA, and branch name.

## Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guidance, including considerations for cloud environments, scalability, and security.

## Frontend Integration

This project is a backend API. A frontend application (e.g., React, Angular, Vue.js) would interact with this API using standard HTTP requests.

**Example Frontend Interaction Flow:**

1.  **User Login:** Frontend sends `POST /api/auth/signin` with credentials.
2.  **Receive JWT:** Backend responds with a JWT. Frontend stores this token (e.g., in `localStorage` or `sessionStorage`).
3.  **Authorized Requests:** For subsequent requests to protected endpoints (e.g., `GET /api/models`), the frontend includes the JWT in the `Authorization` header: `Authorization: Bearer <JWT_TOKEN>`.
4.  **Error Handling:** Frontend handles `401 Unauthorized` (e.g., redirect to login), `403 Forbidden`, `404 Not Found`, `400 Bad Request`, and `429 Too Many Requests` (for rate limiting).
5.  **Model Management UI:** A UI could list models, view versions, upload new versions (potentially allowing file uploads to S3 directly and then registering the path via this API), activate versions.
6.  **Prediction UI:** A form to input data for a selected model, send it to `POST /api/predictions/{modelId}`, and display the prediction result.

## Future Enhancements

*   **Real-time Model Inference:** Integrate with a real ML runtime (e.g., TensorFlow Serving, TorchServe, BentoML, or a custom Python Flask/FastAPI microservice). The current implementation uses a mock.
*   **Model Storage Backend:** Integrate with cloud storage (AWS S3, Azure Blob Storage, Google Cloud Storage) for model binaries instead of just paths.
*   **Advanced Monitoring:** Integrate with Prometheus/Grafana for detailed metrics, ELK stack for logs, and potentially distributed tracing (e.g., Zipkin/Jaeger).
*   **Asynchronous Operations:** For long-running tasks like model training or extensive validation, use message queues (Kafka, RabbitMQ) and background workers.
*   **Multi-tenancy:** Support multiple distinct organizations or users with isolated data.
*   **API Gateway:** Implement an API Gateway (e.g., Spring Cloud Gateway, Nginx, Kong) for centralized routing, more advanced rate limiting, and security.
*   **Model Governance:** Features for approval workflows, model performance dashboards, A/B testing, and model drift detection.
*   **Frontend Application:** Develop a full-fledged web UI to interact with the system.

## License

This project is open-source and available under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0.html).
```