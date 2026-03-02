```markdown
# ML Utilities System - Architecture Documentation

This document describes the architectural design and key components of the ML Utilities System.

## 1. High-Level Overview

The ML Utilities System is designed as a modular, API-first application responsible for managing the lifecycle of Machine Learning models, facilitating their deployment for inference, and providing common data preprocessing functionalities. It aims to be a robust, scalable, and secure backend service for ML-driven applications.

The core idea is to externalize the heavy lifting of ML model training and complex inference engines (e.g., Python-based frameworks) while providing a reliable Java service to orchestrate and manage these ML assets and their usage.

```mermaid
graph TD
    subgraph Clients
        A[Web Frontend]
        B[Other Services / Data Pipelines]
        C[Admin Dashboard]
    end

    subgraph Infrastructure
        D(API Gateway / Load Balancer)
        E[Container Orchestration (Kubernetes/ECS)]
        F[Monitoring & Alerting (Prometheus/Grafana)]
        G[Logging (ELK Stack)]
    end

    subgraph ML Utilities Service (Spring Boot Application)
        H[Security Layer (JWT, RBAC)]
        I[API Controllers]
        J[Business Services]
        K[Data Access (Repositories)]
        L[Caching (Caffeine)]
        M[Cross-Cutting Concerns (Error Handling, Rate Limiting)]
    end

    subgraph External Dependencies
        N(PostgreSQL Database)
        O(Cloud Storage for Models: S3/GCS/Azure Blob)
        P(External ML Inference Engine: Python Microservice / SageMaker / MLflow)
    end

    A -- HTTP/S --> D
    B -- HTTP/S --> D
    C -- HTTP/S --> D

    D -- Route Traffic --> E
    E -- Hosts --> H
    H --> I
    I -- Invoke --> J
    J -- Manage --> K
    J -- Access --> L
    J --> M
    K -- Store/Retrieve --> N
    J -- Fetch Model Data --> O
    J -- Invoke Prediction --> P

    H & I & J & K & L & M -- Emit Logs --> G
    H & I & J & K & L & M -- Emit Metrics --> F

```

## 2. Core Modules (Logical Separation within Single Spring Boot App)

The application is structured into logical packages, each representing a distinct functional module.

### 2.1. `com.mlutil` (Root Package)

*   `MlUtilitiesApplication.java`: Main Spring Boot application entry point.
*   `config/`: Configuration classes (Swagger, Cache, etc.).
*   `core/`: Core utilities, exceptions, and DTOs used across modules.
    *   `exception/`: `ResourceNotFoundException`, `ValidationException`, `GlobalExceptionHandler` for consistent API error responses.
*   `middleware/`: Custom Servlet Filters (e.g., `RateLimitFilter`).

### 2.2. `com.mlutil.auth` (Authentication & Authorization)

*   **Purpose:** Handles user registration, login, and secures API endpoints.
*   **Components:**
    *   `entity/`: `User`, `Role` (with `ROLE_USER`, `ROLE_ADMIN`).
    *   `repository/`: `UserRepository`, `RoleRepository`.
    *   `security/`:
        *   `jwt/`: `JwtTokenProvider` (generates/validates JWTs), `JwtAuthenticationFilter` (extracts/validates JWT from requests).
        *   `CustomUserDetailsService` (integrates users with Spring Security).
        *   `SecurityConfig` (defines security rules,PasswordEncoder, AuthenticationManager).
        *   `JwtAuthEntryPoint` (handles unauthorized access).
    *   `dto/`: `LoginRequest`, `SignUpRequest`, `JwtAuthenticationResponse`.
    *   `controller/`: `AuthController` (endpoints for `/api/auth/signin`, `/api/auth/signup`).
*   **Mechanism:** JWTs are issued upon successful login. Subsequent requests include this token in the `Authorization: Bearer <token>` header. Spring Security validates the token and enforces role-based access control (`@PreAuthorize`).

### 2.3. `com.mlutil.modelmanager` (Model Lifecycle Management)

*   **Purpose:** Manages the registration, versioning, and metadata of ML models.
*   **Components:**
    *   `entity/`: `Model`, `ModelVersion`.
    *   `repository/`: `ModelRepository`, `ModelVersionRepository`.
    *   `dto/`: `ModelDto`, `ModelVersionDto`, `ModelRegisterRequest`, `ModelVersionUploadRequest`.
    *   `mapper/`: `ModelMapper` (MapStruct for DTO-Entity mapping).
    *   `service/`: `ModelService` (business logic for CRUD, versioning, activation).
    *   `controller/`: `ModelController` (REST endpoints for `/api/models`).
*   **Key Logic:**
    *   A `Model` represents a conceptual ML solution (e.g., "Customer Churn Predictor").
    *   `ModelVersion` represents a specific iteration of a model, including its storage path (e.g., S3 URI), file type, and metadata.
    *   Only one `ModelVersion` can be `isActive` at a time for a given `Model`, simplifying prediction serving.
    *   Caching is applied to `Model` and `ModelVersion` data for performance.

### 2.4. `com.mlutil.predictionservice` (Prediction Serving & Logging)

*   **Purpose:** Provides an API for clients to request predictions from deployed models and logs all prediction events.
*   **Components:**
    *   `entity/`: `PredictionLog`.
    *   `repository/`: `PredictionLogRepository`.
    *   `dto/`: `PredictionRequest`, `PredictionResponse`.
    *   `service/`: `PredictionService` (handles prediction flow, delegates to ModelService for active model retrieval, logs requests).
    *   `controller/`: `PredictionController` (REST endpoints for `/api/predictions`).
*   **Key Logic:**
    *   Retrieves the `isActive` `ModelVersion` for a given `modelId`.
    *   **Simulates ML Inference:** Currently, `PredictionService` contains a placeholder `simulateMlInference` method. In a production environment, this would involve calling an external ML inference engine (e.g., a Python microservice, or a specialized ML serving platform).
    *   Logs every prediction request, input, output, and associated metadata for auditing and future model performance analysis.
    *   Prediction endpoints are generally `permitAll` for wider client accessibility, but logs track `userId` if authenticated.

### 2.5. `com.mlutil.dataprocessing` (Data Preprocessing Utilities)

*   **Purpose:** Offers common data transformation utilities that can be used before sending data to a prediction endpoint.
*   **Components:**
    *   `dto/`: `DataProcessingRequest`, `DataProcessingResponse`.
    *   `service/`: `DataProcessingService` (contains logic for various transformations).
    *   `controller/`: `DataProcessingController` (REST endpoint for `/api/data-processing/process`).
*   **Key Logic:**
    *   Supports various `processingType`s (e.g., `MIN_MAX_SCALER`, `ONE_HOT_ENCODER`, `TEXT_VECTORIZER`).
    *   The implementation provides simplified examples; real-world scenarios would require robust, configurable, and potentially pre-trained transformers.

## 3. Database Layer

*   **Technology:** PostgreSQL (relational database).
*   **ORM:** Spring Data JPA with Hibernate.
*   **Schema Management:** Flyway for version-controlled database migrations.
    *   `V1__Initial_Schema.sql`: Sets up all necessary tables (`users`, `roles`, `models`, `model_versions`, `prediction_logs`).
    *   `V2__Add_Seed_Data.sql`: Populates initial roles, an admin user, a regular user, and example models/versions.
*   **Query Optimization:**
    *   `@ManyToOne` and `@OneToMany` relationships are configured with `FetchType.LAZY` to prevent N+1 issues by default.
    *   `open-in-view: false` is configured to keep database transactions short.
    *   Indexes are defined implicitly by JPA for primary keys and explicitly for unique constraints. Additional indexes on frequently queried columns (e.g., `prediction_logs.model_id`, `prediction_logs.predicted_at`) would be added based on production query patterns.

## 4. Cross-Cutting Concerns

*   **Caching:** Spring Cache with Caffeine as the in-memory provider. Used for `Model` and `ModelVersion` metadata to reduce database load. Configured with a `maximumSize` and `expireAfterWrite`.
*   **Logging:** SLF4J with Logback. Configured for console output, and rolling files for info and error logs.
*   **Monitoring:** Spring Boot Actuator provides `health`, `info`, `metrics`, `prometheus` endpoints. Integrates with Prometheus and Grafana for system-wide monitoring.
*   **Error Handling:** Global exception handler (`@ControllerAdvice`) provides consistent JSON error responses for `ResourceNotFoundException`, `ValidationException`, and generic `Exception`.
*   **Rate Limiting:** A custom `RateLimitFilter` using Google Guava's `RateLimiter` is applied to API endpoints to prevent abuse.

## 5. Deployment & Operations

*   **Containerization:** `Dockerfile` and `docker-compose.yml` enable easy containerization and local orchestration of the application and its PostgreSQL database.
*   **CI/CD:** GitHub Actions pipeline automates building, testing, and Docker image publishing.
*   **Environment Configuration:** `application.yml` uses Spring profiles (`dev`, `prod`) and environment variables for sensitive data (e.g., `DB_PASSWORD`, `JWT_SECRET`).
*   **Health Checks:** Docker Compose includes health checks for both the application and database.

## 6. Scalability Considerations

*   **Stateless Application:** The Spring Boot application is stateless (session management is `STATELESS` with JWTs), making it easy to scale horizontally by running multiple instances behind a load balancer.
*   **Database Scalability:** PostgreSQL can be scaled using read replicas, sharding, or moving to managed database services (AWS RDS, Azure Database for PostgreSQL).
*   **Caching:** Caffeine provides local caching. For a distributed system, this would be replaced or augmented with a distributed cache (e.g., Redis, Memcached).
*   **ML Inference Engine:** The mock prediction service is the primary bottleneck for real ML workloads. Scaling this part requires a robust ML serving infrastructure (e.g., Kubernetes + KServe, SageMaker endpoints).
*   **Asynchronous Processing:** For computationally intensive or long-running tasks, integrating a message queue (e.g., Kafka, RabbitMQ) and separate worker services would be crucial.

## 7. Security Considerations

*   **JWT Security:** Robust JWT generation and validation with secure secret key management.
*   **Password Hashing:** BCrypt used for password storage.
*   **Role-Based Access Control:** Fine-grained authorization using Spring Security's `@PreAuthorize`.
*   **Input Validation:** `jakarta.validation` annotations are used for validating incoming API request payloads.
*   **SQL Injection Prevention:** Spring Data JPA's ORM approach inherently prevents most SQL injection vulnerabilities.
*   **Environment Variables:** Sensitive configurations are sourced from environment variables.
*   **Rate Limiting:** Protects against certain types of Denial-of-Service attacks.
*   **HTTPS:** Assumed to be handled by an API Gateway or Load Balancer in a production deployment.

This architectural overview provides a foundation for the ML Utilities System. Each component is designed with best practices in mind to ensure a reliable, maintainable, and scalable solution.
```