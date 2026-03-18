# ML Utilities System - Architecture Documentation

This document outlines the architectural design of the ML Utilities System, covering its components, interactions, and design principles.

## 1. High-Level Architecture

The system follows a typical client-server, multi-tier architecture, separating presentation, business logic, and data layers.

```mermaid
graph TD
    User(Web Browser) --> |HTTP/HTTPS| Frontend[React.js Frontend (Nginx)]
    Frontend --> |HTTP/HTTPS /api/v1/| Backend[C++ Backend API (Crow)]
    Backend --> Database[SQLite3 Database (file-based)]

    subgraph Infrastructure
        Frontend -- Docker --> DockerContainer[Docker Container]
        Backend -- Docker --> DockerContainer
        Database -- Volume Mount --> DockerContainer
    end

    subgraph Cloud Deployment (Example)
        Frontend --> LoadBalancer[Load Balancer] --> WebServer[Frontend Web Server (e.g., Nginx, K8s Pod)]
        Backend --> LoadBalancer2[Load Balancer] --> API[Backend API Server (e.g., K8s Pod)]
        API --> DatabaseService[Managed Database Service (e.g., AWS RDS)]
    end
```

## 2. Component Breakdown

### 2.1. Frontend (React.js with TypeScript)

*   **Purpose**: Provides the user-facing web interface for interacting with the ML Utilities.
*   **Technology Stack**:
    *   **Framework**: React.js
    *   **Language**: TypeScript
    *   **UI Library**: Chakra UI (for accessible and responsive components)
    *   **Routing**: React Router DOM
    *   **HTTP Client**: Axios (with interceptors for authentication and error handling)
    *   **Containerization**: Docker (served by Nginx)
*   **Key Modules/Components**:
    *   `src/pages/`: Page-level components (Login, Register, Dashboard, Models, Transforms).
    *   `src/components/`: Reusable UI components (Navbar, Layout, ProtectedRoute).
    *   `src/services/`: API client wrappers for each backend domain (auth, models, transforms).
    *   `src/store/authContext.tsx`: React Context for global authentication state management.
    *   `src/types/`: TypeScript interfaces for data structures (User, MLModel, TransformData).
*   **Design Principles**:
    *   **Component-based**: Modular and reusable UI components.
    *   **State Management**: Centralized authentication state, local state for other components.
    *   **Type Safety**: Leveraging TypeScript to catch errors early.
    *   **Responsive Design**: Using Chakra UI for adaptive layouts.

### 2.2. Backend (C++ API)

*   **Purpose**: Core application logic, data processing, ML utilities, database interaction, and API endpoint exposure. Designed for high performance.
*   **Technology Stack**:
    *   **Web Framework**: `Crow` (lightweight, header-only C++ microframework)
    *   **Database ORM/Wrapper**: `sqlite_modern_cpp` (for SQLite interaction)
    *   **JSON Handling**: `nlohmann/json`
    *   **Authentication**: `jwt-cpp` (for JWT token generation and verification)
    *   **Logging**: `spdlog`
    *   **Password Hashing**: (Mocked in example, but `argon2` or `bcrypt` recommended for production)
    *   **Build System**: CMake
    *   **Containerization**: Docker
*   **Key Modules/Components**:
    *   `src/main.cpp`: Server initialization, middleware setup, and route registration.
    *   `src/config/`: Application configuration loaded from environment variables (`AppConfig` singleton).
    *   `src/database/`: `DatabaseManager` singleton for SQLite connection and migration management.
    *   `src/middleware/`: Custom Crow middleware for Logging, Authentication (`AuthMiddleware`), Caching (`CacheMiddleware`), and Rate Limiting (`RateLimitMiddleware`).
    *   `src/models/`: Plain Old C++ Objects (POCOs) representing database entities (User, Model) and data structures for ML (TransformData). Includes UUID generation.
    *   `src/services/`: Business logic layer (e.g., `UserService`, `ModelService`, `MLTransformService`) encapsulating database operations and core logic.
    *   `src/controllers/`: API endpoint handlers that interact with services and manage request/response parsing (e.g., `AuthController`, `ModelController`).
    *   `src/common/`: Shared utilities like JSON parsing (`JsonUtils`) and structured error handling (`ErrorHandling`).
*   **Design Principles**:
    *   **Layered Architecture**: Clear separation of concerns (controller -> service -> database/model).
    *   **Singleton Pattern**: Used for `AppConfig` and `DatabaseManager` to ensure single instances and global access.
    *   **Dependency Injection (Implicit)**: Services and controllers create instances of their dependencies (e.g., `UserService` implicitly uses `DatabaseManager`). For larger projects, explicit DI containers could be considered.
    *   **Robust Error Handling**: Custom exception hierarchy and a global exception handler.
    *   **Security**: JWT-based authentication, placeholder for strong password hashing, rate limiting.
    *   **Performance**: C++ for computationally intensive tasks, lightweight web framework.

### 2.3. Database Layer (SQLite3)

*   **Purpose**: Persistent storage for application data.
*   **Technology**: SQLite3 (file-based embedded database).
*   **Schema**:
    *   `users`: Stores user credentials (`id`, `username`, `email`, `password_hash`, timestamps).
    *   `models`: Stores metadata about ML models (`id`, `user_id`, `name`, `description`, `version`, `model_path`, `status`, `metadata` JSON, timestamps).
    *   `migrations`: Tracks applied database migrations.
*   **Migrations**: SQL scripts (`.sql` files) are used for schema evolution, managed by `DatabaseManager`.
*   **Query Optimization**: Basic indexing is applied (`idx_users_email`, `idx_models_user_id`, `idx_models_name`). For larger datasets, more advanced indexing and query analysis would be required.

## 3. Data Flow and Interactions

1.  **User Request**: A user interacts with the React frontend in their browser.
2.  **Frontend Routing**: React Router maps the URL to the appropriate component.
3.  **API Call**: Frontend components use `axios` to make HTTP requests to the backend API (`/api/v1/`).
4.  **Nginx Proxy**: In the Docker setup, Nginx serves the static React files and proxies requests to `/api/` to the `backend` service running on port `8080`.
5.  **Backend Middleware**: The Crow application receives the request.
    *   `LoggingMiddleware`: Logs incoming request details.
    *   `RateLimitMiddleware`: Checks and enforces API rate limits based on IP.
    *   `CacheMiddleware`: For GET requests, checks if a cached response exists. If so, returns it immediately. For mutating requests (POST, PUT, DELETE), it invalidates relevant cache entries.
    *   `AuthMiddleware`: Extracts JWT from `Authorization` header, verifies it, and injects `user_id` into the request context for authenticated routes.
6.  **Controller Execution**: The appropriate controller method (`AuthController`, `ModelController`, etc.) is invoked.
7.  **Service Logic**: Controllers delegate business logic to the respective service (`UserService`, `ModelService`, `MLTransformService`).
8.  **Database Interaction**: Services interact with the `DatabaseManager` to perform CRUD operations via `sqlite_modern_cpp`.
9.  **Response Generation**: Services return data to controllers. Controllers format the response (using `JsonUtils`) and send it back via Crow.
10. **Frontend Display**: The frontend receives the JSON response, updates its state, and renders the changes in the UI.

## 4. Scalability Considerations

*   **Backend**: C++ provides inherent performance benefits. For higher concurrency, `Crow` can run multithreaded (as configured in `main.cpp`). For extreme scale, container orchestration (Kubernetes) and horizontal scaling of backend instances would be employed.
*   **Database**: SQLite is suitable for small to medium-sized applications or for a single backend instance. For distributed or highly concurrent environments, a dedicated relational database (PostgreSQL, MySQL) or NoSQL solution would be necessary, with `DatabaseManager` being refactored to use an appropriate ORM or client library.
*   **Caching**: The in-memory `CacheMiddleware` is basic. For larger scale, a distributed cache like Redis or Memcached would be integrated.
*   **Message Queues**: For asynchronous tasks (e.g., actual model training, large data preprocessing), a message queue (RabbitMQ, Kafka) would be introduced to decouple and manage workload.
*   **Cloud Native**: The Dockerized setup is conducive to deployment on cloud platforms like AWS ECS, Azure Container Apps, or Kubernetes.

## 5. Security Considerations

*   **Authentication**: JWTs are used, with tokens stored securely (in `localStorage` on frontend, though `HttpOnly` cookies are often preferred for stronger XSS protection in production). JWT `secret` is loaded from environment variables.
*   **Password Security**: Password hashing is a critical component. While mocked with a simple string concatenation for this example, a production system *must* use a strong, slow hashing algorithm like Argon2 or bcrypt.
*   **Input Validation**: Backend performs basic input validation. More comprehensive validation (e.g., schema validation) is crucial for all API inputs.
*   **Rate Limiting**: Prevents abuse and DDoS attacks.
*   **Access Control**: The `AuthMiddleware` verifies user identity. Granular role-based access control (RBAC) would be implemented in services/controllers to ensure users only access their authorized resources.
*   **Environment Variables**: Sensitive information (JWT secret, database credentials) is kept out of source code and managed via environment variables.

## 6. Future Enhancements

*   **Real ML Integration**: Connect to actual ML frameworks (TensorFlow, PyTorch) via C++ bindings, ONNX Runtime, or separate microservices.
*   **Data Storage**: Implement file storage for actual model binaries (e.g., integration with S3, Azure Blob Storage).
*   **Monitoring & Alerting**: Integrate Prometheus/Grafana for metrics, ELK stack for centralized logging, and alerting tools.
*   **Advanced Data Processing**: More complex transformations, feature engineering, and data pipeline orchestration.
*   **UI/UX Improvements**: Richer dashboards, interactive data visualizations, model performance metrics.
*   **WebSockets**: For real-time updates (e.g., model training progress).
*   **API Gateway**: For advanced routing, security, and analytics in a microservices environment.
*   **Asynchronous Tasks**: Use message queues and background workers for long-running operations.

This architecture provides a solid foundation for building and scaling a robust ML Utilities system.
```