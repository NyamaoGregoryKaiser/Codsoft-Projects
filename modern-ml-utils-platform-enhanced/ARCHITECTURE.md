```markdown
# MLOps Core Service Architecture Documentation

This document describes the high-level architecture of the MLOps Core Service, a C++ backend for managing and serving Machine Learning models.

## 1. High-Level Overview

The MLOps Core Service is designed as a standalone, high-performance RESTful API service. It acts as a central hub for managing the lifecycle of ML models from registration to prediction serving. It's built with C++ for performance, enabling low-latency predictions and efficient resource utilization.

```mermaid
graph TD
    A[Clients/Frontend/Other Services] -->|REST API (HTTP/JSON)| B(MLOps Core Service)

    subgraph MLOps Core Service
        B --> C[API Controller]
        C --1--> D[Authentication Middleware]
        C --2--> E[Error Handling Middleware]
        C --3--> F[Prediction Service]
        C --4--> G[Database Manager]

        F --> H[Model Version Cache (LRU)]
        F --> I[Loaded Models Runtime Cache]
        I --> J[Model Factories/Loaders]

        G --> K[SQLite Database]
        G --.-> L[Model Files Storage]
    end

    K -- Data Persistence --> M[Filesystem]
    L -- Model Binaries --> M
    B -- Logging --> N[Log Files]
```

## 2. Component Breakdown

### 2.1. API Layer (Crow Web Framework)

*   **Crow**: A lightweight C++ web microframework used to build the REST API. It handles HTTP requests, routing, and JSON serialization/deserialization.
*   **`APIController`**:
    *   Acts as the entry point for all API requests.
    *   Defines routes (`/api/v1/models`, `/api/v1/predict`, etc.) and handles incoming HTTP requests.
    *   Parses request bodies, validates inputs, and orchestrates calls to `DatabaseManager` and `PredictionService`.
    *   Serializes service responses into JSON format.
*   **`AuthMiddleware`**:
    *   A Crow middleware component responsible for authenticating requests using JWT (JSON Web Tokens).
    *   Validates the JWT token in the `Authorization` header.
    *   Extracts user identity (e.g., `user_id`, `role`) and populates the request context.
    *   Enforces role-based authorization for specific endpoints (e.g., only `admin` can create models).
*   **`ErrorHandler`**:
    *   A Crow middleware/utility for consistent error handling.
    *   Catches exceptions thrown by the API or services.
    *   Transforms exceptions into standardized JSON error responses with appropriate HTTP status codes (e.g., 400 Bad Request, 404 Not Found, 500 Internal Server Error).
    *   Includes a custom `ApiException` class for structured API-specific errors.

### 2.2. Core Business Logic & Services

*   **`DatabaseManager`**:
    *   Manages interactions with the SQLite database.
    *   Provides a high-level API for CRUD (Create, Read, Update, Delete) operations on `Models`, `ModelVersions`, and `PredictionLogs`.
    *   Uses `sqlite_orm` to map C++ structs to database tables, simplifying SQL interactions.
    *   Handles data integrity (e.g., cascading deletes for versions when a model is deleted).
*   **`PredictionService`**:
    *   The central component for serving ML predictions.
    *   Responsible for fetching model metadata from `DatabaseManager`.
    *   Utilizes a **`ModelVersionCache`** (in-memory LRU cache) to quickly retrieve frequently requested model version metadata.
    *   Maintains an **`Loaded Models Runtime Cache`** (in-memory map of `BaseModel` instances) to store active, deserialized ML models, preventing repeated loading from disk.
    *   Delegates the actual inference logic to `BaseModel` implementations (e.g., `LinearRegressionModel`).
    *   Logs prediction requests and results to the database via `DatabaseManager`.
    *   Provides a `reloadModelVersion` function to invalidate caches and force a model to be reloaded if its definition changes.
*   **`BaseModel` & `LinearRegressionModel`**:
    *   `BaseModel` defines an interface for all ML models, specifying `load()` and `predict()` methods.
    *   `LinearRegressionModel` is a dummy implementation demonstrating how a specific ML model would be loaded and perform inference. In a real-world scenario, this would integrate with actual ML runtimes (e.g., ONNX Runtime, LibTorch, TensorFlow C API).
*   **`ModelFactory`**:
    *   Responsible for instantiating concrete `BaseModel` implementations based on a given model type.

### 2.3. Utility Components

*   **`Config`**:
    *   Singleton class for loading and accessing application configuration (e.g., database path, server port, JWT secret).
    *   Reads from `config/default.json` at startup.
*   **`Logger`**:
    *   Singleton class providing structured logging capabilities (INFO, WARN, ERROR, DEBUG).
    *   Outputs logs to console and a configured log file.
    *   Thread-safe.
*   **`JsonUtils`**:
    *   Helper functions for converting between C++ DTOs (Data Transfer Objects) and `nlohmann::json` objects, facilitating API request/response handling and database storage of JSON strings.
*   **`Types`**:
    *   Common data structures (DTOs) and enums used across the application.

### 2.4. Data Storage

*   **SQLite Database**:
    *   Used for storing all model metadata (`models`, `model_versions`) and `prediction_logs`.
    *   Chosen for its simplicity and file-based nature, making it easy to set up for demonstrations and local development. For high-scale production, it would be replaced by PostgreSQL or MySQL.
*   **Model Files Storage**:
    *   A dedicated directory (`./models` by default) for storing the actual serialized ML model files (e.g., `.json` for dummy models, `.onnx`, `.pt`, `.pb` for real models).
    *   The `model_path` in `ModelVersionDTO` points to these files.

### 2.5. External Scripts & Tooling

*   **`scripts/db/migrate.py`**: A Python script for applying database schema migrations and seeding initial data. Ensures database schema evolution is managed.
*   **`tests/`**: Contains C++ unit tests (Google Test) and Python integration tests (`pytest` + `requests`) for verifying application correctness and API behavior.
*   **`scripts/perf/locustfile.py`**: A Locust script for performance and load testing the API endpoints.
*   **`scripts/generate_jwt.py`**: A Python utility to easily generate JWT tokens for testing and development.
*   **`Dockerfile` / `docker-compose.yml`**: Define the containerization and orchestration of the service for consistent deployment environments.
*   **`.gitlab-ci.yml`**: Defines the CI/CD pipeline for automated build, test, and deployment stages.

## 3. Data Flow Example: Serving a Prediction

1.  **Client Request**: A client sends a `POST` request to `/api/v1/predict/{model_id}/{version_id}` with input data and a JWT token in the `Authorization` header.
2.  **Auth Middleware**: `AuthMiddleware` intercepts the request, validates the JWT, and checks if the user's role (`predictor` or `admin`) is authorized for prediction. If not, a `403 Forbidden` response is returned.
3.  **API Controller**: `APIController` receives the request, parses the JSON input, and calls `PredictionService::predict()`.
4.  **Prediction Service**:
    *   It first checks its `ModelVersionCache` for the requested `version_id`.
    *   If not in cache, it retrieves `ModelVersionDTO` metadata from the `DatabaseManager`.
    *   If the version is inactive or not found, an error is thrown.
    *   It then checks its `Loaded Models Runtime Cache` for an already instantiated `BaseModel` object corresponding to the `version_id`.
    *   If the model instance is not in the runtime cache, `ModelFactory::createModel()` is called, and the model's `load()` method is invoked using the `model_path` and `parameters` from the `ModelVersionDTO`. The loaded model is then stored in the runtime cache.
    *   The `predict()` method of the loaded `BaseModel` instance is called with the client's input data.
    *   After receiving the prediction output, `PredictionService` calls `DatabaseManager::createPredictionLog()` to store the input, output, and status.
5.  **API Controller**: Receives the prediction output, converts it to JSON, and sends a `200 OK` response to the client.
6.  **Error Handling**: If any error occurs during this flow (e.g., invalid input, model not found, prediction failure), the `ErrorHandler` catches the exception and returns a standardized JSON error response.

## 4. Scalability and Performance Considerations

*   **C++ for Performance**: The choice of C++ provides low-level control and high execution speed, crucial for low-latency prediction serving.
*   **Multithreading (Crow)**: Crow's `multithreaded().run()` option allows the server to handle multiple concurrent requests efficiently.
*   **In-memory Caching**: `ModelVersionCache` and `Loaded Models Runtime Cache` significantly reduce database lookups and disk I/O for frequently used models, boosting prediction throughput.
*   **Database**: SQLite is suitable for small to medium scale. For high-volume environments, replacing `sqlite_orm` with a PostgreSQL/MySQL/NoSQL backend via an appropriate C++ driver would be necessary.
*   **Model Loading**: Lazy loading of `BaseModel` instances on first request (per server instance) and caching minimizes startup time and memory footprint for less-used models.
*   **Statelessness (Mostly)**: The API endpoints are mostly stateless, relying on JWT and database for state, which is good for horizontal scaling. The in-memory caches are per-instance, but the `PredictionService::reloadModelVersion` mechanism ensures consistency across instances in a distributed setup (e.g., triggered by a pub/sub event).
*   **Asynchronous Operations**: While Crow can support async, this implementation uses synchronous operations for simplicity. For extreme I/O bound tasks, async could be considered.

## 5. Future Enhancements

*   **Real ML Runtime Integration**: Replace dummy `LinearRegressionModel` with integrations for ONNX Runtime, LibTorch, TensorFlow C API, etc.
*   **External Configuration Management**: Use solutions like Consul or Kubernetes ConfigMaps instead of local JSON files.
*   **Advanced Caching**: Distributed caching (e.g., Redis) for `ModelVersionCache` to span multiple service instances.
*   **Rate Limiting**: Implement per-user or per-endpoint rate limiting to prevent abuse.
*   **Monitoring & Metrics**: Integrate with Prometheus/Grafana for detailed performance metrics (e.g., request latency, error rates, cache hit/miss ratio).
*   **Asynchronous Prediction**: For long-running predictions, implement an asynchronous API (e.g., request-response with webhooks or polling a job status endpoint).
*   **Dynamic Model Updates**: Mechanism for model updates (reloading without restarting service) beyond just cache invalidation (e.g., hot-swapping model binaries).
*   **Advanced Authorization**: More granular permissions (e.g., specific users can only access certain models).
*   **API Gateway**: Use an API Gateway (e.g., Nginx, Envoy, Kong) for rate limiting, traffic management, additional security, and API composition.
*   **Frontend**: Develop a UI using a framework like React, Vue, or Angular to interact with the API.

This architectural blueprint provides a solid foundation for building a scalable and reliable MLOps platform.
```