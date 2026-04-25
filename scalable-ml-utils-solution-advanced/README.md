# ML Utilities System

A comprehensive, production-ready full-stack application for managing Machine Learning models and serving predictions.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Features](#2-features)
3.  [Architecture](#3-architecture)
4.  [Technology Stack](#4-technology-stack)
5.  [Setup Instructions](#5-setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup (Java)](#backend-setup-java)
    *   [Frontend Setup (React)](#frontend-setup-react)
    *   [Docker Setup](#docker-setup)
6.  [API Documentation (Swagger UI)](#6-api-documentation-swagger-ui)
7.  [Testing](#7-testing)
8.  [Authentication & Authorization](#8-authentication--authorization)
9.  [Configuration](#9-configuration)
10. [Deployment Guide](#10-deployment-guide)
11. [Future Enhancements](#11-future-enhancements)

## 1. Introduction

The ML Utilities System is designed to streamline the lifecycle management of Machine Learning models. It provides a robust backend for model registration, versioning, activation, and a dedicated service for making predictions. The intuitive frontend allows users (especially administrators) to interact with the system, manage models, and test predictions with ease.

This project emphasizes enterprise-grade quality, including a layered architecture, strong typing, comprehensive testing, secure authentication, caching, rate-limiting, and detailed documentation.

## 2. Features

**Core ML Utilities:**

*   **Model Registration:** Register new ML models with names and descriptions.
*   **Model Versioning:** Upload new versions of existing models, keeping track of metadata (accuracy, precision, etc.).
*   **Model Activation:** Designate a specific version of a model as "active" for inference, allowing seamless updates without downtime.
*   **Prediction Service:** A dedicated API endpoint to serve predictions using the active (or specified) model version.
*   **Model Storage:** Persistent storage for uploaded model files (simulated with local filesystem, extensible to S3/Azure Blob).

**Full-stack Web Development:**

*   **Backend API (Java/Spring Boot):** RESTful API with CRUD operations for models and versions, and a prediction endpoint.
*   **Frontend UI (React/TypeScript):** Responsive web interface for model listing, details, version management, model upload, and prediction testing.

**Enterprise-Grade Features:**

*   **Authentication & Authorization (JWT):** Secure access control using JSON Web Tokens (JWT) with user roles (ADMIN, USER).
*   **Database Layer:** PostgreSQL with Flyway for schema migrations and JPA/Hibernate for ORM.
*   **Configuration:** Externalized application properties, Docker support.
*   **Testing:** Unit, Integration (with Testcontainers), and API tests to ensure high quality and reliability.
*   **Documentation:** Comprehensive README, API docs (Swagger UI), and architecture overview.
*   **Logging & Monitoring:** Structured logging with SLF4J/Logback, basic Actuator endpoints.
*   **Error Handling:** Global exception handling middleware for consistent API error responses.
*   **Caching Layer:** Spring Cache with Caffeine for improved performance of frequently accessed data.
*   **Rate Limiting:** Custom interceptor to prevent API abuse on prediction endpoints.
*   **UI/UX:** Basic, clean, and functional user interface.

## 3. Architecture

The system follows a layered, modular architecture common in enterprise applications:

*   **Client Layer (Frontend):** React.js + TypeScript SPA, consuming the REST API.
*   **API Layer (Backend Controllers):** Spring Boot REST Controllers, handling HTTP requests, input validation, and delegating to services.
*   **Service Layer (Business Logic):** Spring Services, containing core business logic, transactions, and interacting with repositories.
*   **Data Access Layer (Repository):** Spring Data JPA repositories, abstracting database interactions.
*   **Database Layer:** PostgreSQL for persistent storage, managed by Flyway for migrations.
*   **Model Storage:** A dedicated directory (or cloud storage in production) for actual ML model files.

**Key Components Diagram (High-Level):**

```
+----------------+      HTTP/REST      +------------------+
|    Frontend    |<-------------------->|      Backend     |
| (React/TS SPA) |                     |(Spring Boot/Java)|
+----------------+                     +---------+--------+
                                                 |
                                                 | (JPA/Hibernate)
                                                 v
                                        +--------+--------+
                                        |   Database (PG) |
                                        |(Models, Versions)|
                                        +-----------------+
                                                 ^
                                                 | (File I/O)
                                                 |
                                        +--------+--------+
                                        | Model Storage   |
                                        |(e.g., /ml-models)|
                                        +-----------------+
```

## 4. Technology Stack

**Backend:**

*   **Language:** Java 17
*   **Framework:** Spring Boot 3.2.x
*   **Web:** Spring Web (RESTful APIs)
*   **Database:** PostgreSQL
*   **ORM:** Spring Data JPA, Hibernate
*   **Database Migrations:** Flyway
*   **Security:** Spring Security (JWT for stateless authentication, BCrypt for password hashing)
*   **Caching:** Spring Cache with Caffeine
*   **API Documentation:** Springdoc-OpenAPI (Swagger UI)
*   **Logging:** SLF4J + Logback (Spring Boot default)
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers (for integration tests)
*   **Build Tool:** Maven

**Frontend:**

*   **Framework:** React 18
*   **Language:** TypeScript
*   **HTTP Client:** Axios
*   **Routing:** React Router DOM
*   **State Management:** React Context (for authentication)
*   **Build Tool:** Create React App scripts

**Containerization & CI/CD:**

*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions (placeholder configuration provided)

## 5. Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Java Development Kit (JDK) 17 or higher**
*   **Maven 3.6 or higher**
*   **Node.js (LTS version, e.g., 20.x)**
*   **npm (Node Package Manager)**
*   **Docker Desktop (includes Docker Engine and Docker Compose)**
*   A good IDE (IntelliJ IDEA, VS Code) is recommended.

### Backend Setup (Java)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system/backend
    ```

2.  **Configure Database:**
    The application is configured to use PostgreSQL. You can start a local PostgreSQL instance using Docker (see Docker Setup section) or install it locally.
    Ensure your `application.yml` (or environment variables) point to your PostgreSQL instance.
    *Default `application.yml` points to `localhost:5432` with user `mluser`, password `mlpassword`, db `ml_util_db`.*

3.  **Build the project:**
    ```bash
    mvn clean install
    ```
    This will compile the code, run tests, and package the application into a JAR file.

4.  **Run the application:**
    ```bash
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080/api/v1`.
    The model files will be stored in `./ml-models` directory relative to where the application is run.

### Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API URL:**
    Create a `.env` file in the `frontend/` directory if you're running the backend on a different host/port than `http://localhost:8080/api/v1`.
    ```
    # frontend/.env
    REACT_APP_API_URL=http://localhost:8080/api/v1
    ```
    (Note: if running with Docker Compose, the `docker-compose.yml` will handle this environment variable during the frontend build).

4.  **Run the application:**
    ```bash
    npm start
    ```
    The frontend will start on `http://localhost:3000`.

### Docker Setup

The easiest way to get the entire system running is with Docker Compose.

1.  **Ensure Docker Desktop is running.**

2.  **Build and start the services:**
    Navigate to the root directory of the project (`ml-utilities-system/`).
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images even if they exist (useful for changes).
    *   `-d`: Runs containers in detached mode (in the background).

3.  **Verify services:**
    ```bash
    docker-compose ps
    ```
    You should see `db`, `backend`, and `frontend` containers running.

4.  **Access the applications:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:8080/api/v1`
    *   **Swagger UI:** `http://localhost:8080/api/v1/swagger-ui.html`

5.  **Stop and remove services:**
    ```bash
    docker-compose down
    ```
    This will stop containers and remove networks. To also remove volumes (database data, model files):
    ```bash
    docker-compose down -v
    ```

## 6. API Documentation (Swagger UI)

The backend provides interactive API documentation using Springdoc-OpenAPI (Swagger UI).
Once the backend is running, access it at: `http://localhost:8080/api/v1/swagger-ui.html`

You can use the Swagger UI to explore endpoints, send requests, and test the API. Remember to authenticate by clicking the "Authorize" button and providing a JWT token (obtained from the `/auth/login` endpoint).

**Default Credentials (pre-seeded in `data.sql` and `V2__Add_users_table.sql`):**

*   **Admin:** `username: admin`, `password: password`
*   **User:** `username: user`, `password: password`

## 7. Testing

The project includes various types of tests:

*   **Unit Tests:** For isolated components (services, utilities). Aim for 80%+ coverage.
    *   Run with Maven: `mvn test` (from `backend/` directory)
*   **Integration Tests:** For testing interactions between components (e.g., service with repository) and the full Spring context. Uses Testcontainers to spin up a real PostgreSQL database for each test run.
    *   Run with Maven: `mvn test` (included in `mvn clean install`)
*   **API Tests:** Controller tests using `MockMvc` to simulate HTTP requests against endpoints, verifying responses and security.
    *   Run with Maven: `mvn test` (included in `mvn clean install`)
*   **Frontend Tests:** React components are tested using `@testing-library/react`.
    *   Run from `frontend/` directory: `npm test`

To run all backend tests:
```bash
cd backend
mvn clean test
```
To run all frontend tests:
```bash
cd frontend
npm test
```

## 8. Authentication & Authorization

The system uses JWT (JSON Web Tokens) for stateless authentication.

*   **Login:** Users authenticate via `/auth/login` with username/password, receiving a JWT token.
*   **Authorization:** The JWT token must be included in the `Authorization` header as `Bearer <TOKEN>` for all protected API endpoints.
*   **Roles:**
    *   `ROLE_ADMIN`: Can perform all CRUD operations on models and versions, including activation and deletion.
    *   `ROLE_USER`: Can view models and versions, and make predictions. Cannot create, update, or delete models/versions.
*   Spring Security's `@PreAuthorize` is used for method-level security.

## 9. Configuration

**Backend (`backend/src/main/resources/application.yml`):**

*   **Database:** Configured for PostgreSQL, using environment variables for sensitive data (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.).
*   **JWT:** `jwt.secret` (crucial for security, must be long and complex, ideally from environment variables), `jwt.expiration-ms`.
*   **Caching:** `spring.cache.caffeine.spec` defines cache policies.
*   **Model Storage:** `app.model-storage-path` defines where model files are saved. Defaults to `./ml-models` on the host, `/app/ml-models` in Docker.
*   **Rate Limiting:** `app.rate-limit.*` controls rate-limiting settings (capacity, refill rate).

**Frontend (`frontend/.env` and `docker-compose.yml`):**

*   `REACT_APP_API_URL`: Points to the backend API. Configured via `.env` for local dev or `docker-compose.yml` for containerized deployments.

## 10. Deployment Guide

**Local Deployment (using Docker Compose):**
As described in [Docker Setup](#docker-setup), `docker-compose up --build -d` is the easiest way to deploy locally.

**Production Deployment:**

For a real production environment, consider the following:

1.  **Kubernetes/Cloud Native:** Deploy backend as a microservice in Kubernetes (GKE, EKS, AKS) or to cloud platforms like AWS ECS, Azure App Service, Google Cloud Run.
2.  **Database:** Use a managed database service (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL).
3.  **Model Storage:** Instead of local filesystem, use object storage like AWS S3, Azure Blob Storage, or Google Cloud Storage. The `ModelStorageUtil` would need to be adapted.
4.  **Secrets Management:** Use proper secret management solutions (Vault, AWS Secrets Manager, Kubernetes Secrets) for database credentials, JWT secret, etc.
5.  **CI/CD Pipeline:** The provided `.github/workflows/ci.yml` is a starting point for GitHub Actions. Extend it to include:
    *   Automated Docker image builds and pushes to a container registry (Docker Hub, ECR, GCR).
    *   Automated deployment to staging/production environments.
    *   Post-deployment smoke tests.
6.  **Load Balancing & Scalability:** Deploy multiple instances of the backend behind a load balancer for high availability and scalability.
7.  **Monitoring & Alerting:** Integrate with advanced monitoring tools (Prometheus, Grafana, ELK Stack, Datadog) for metrics, logs, and alerts.
8.  **HTTPS:** Ensure all traffic is encrypted with HTTPS. Use an Nginx ingress controller in Kubernetes or cloud load balancer features.

## 11. Future Enhancements

*   **Robust Model Registry:** Integrate with dedicated MLflow, SageMaker, or a custom feature store solution.
*   **Asynchronous Operations:** For long-running tasks like model training or large file processing, use message queues (Kafka, RabbitMQ) and async processing.
*   **Scalable Inference:** Implement model serving with frameworks like TensorFlow Serving, TorchServe, or KServe, rather than in-app loading.
*   **Data Validation:** Add more sophisticated data validation for prediction inputs.
*   **Data Preprocessing Pipelines:** Integrate a system for managing data preprocessing steps associated with models.
*   **User Management UI:** Create an admin UI for managing users and roles.
*   **Advanced Monitoring:** Integrate with Prometheus/Grafana for detailed application and ML-specific metrics (inference latency, error rates, model drift).
*   **Frontend UI/UX:** Enhance the React frontend with better styling, component libraries (e.g., Material UI, Ant Design), and more detailed model dashboards.
*   **WebSockets:** For real-time updates (e.g., model training status).
*   **Multi-tenancy:** If the system is to be used by multiple organizations, implement multi-tenancy.

---
**Disclaimer:** This project is a comprehensive demonstration aiming to cover a wide range of requirements. While designed with production considerations, specific enterprise deployments may require further hardening, performance tuning, and integration with existing infrastructure and security policies.