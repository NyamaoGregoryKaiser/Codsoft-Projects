# DataVizPro: Architecture Documentation

This document outlines the high-level architecture of the DataVizPro system.

## 1. System Overview

DataVizPro is a web-based data visualization platform that allows users to connect to various databases, design interactive dashboards, and create custom visualizations. It follows a classic client-server architecture with a clear separation between the frontend UI and the backend API, enabling independent development and scaling.

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    A[User/Browser] -->|HTTP/HTTPS| B(Nginx/Load Balancer)
    B -->|HTTP/HTTPS (port 80/443)| C[Frontend (React/Vite)]
    C -->|HTTP/HTTPS (API Calls)| D(Backend API Gateway/Load Balancer)
    D -->|HTTP/HTTPS (port 8080)| E[Backend (Spring Boot App)]

    E -->|JDBC/Native Drivers| F(External Data Sources)
    E -->|JDBC/PostgreSQL Protocol| G[Database (PostgreSQL)]

    subgraph Backend Services
        E -- Kafka/RabbitMQ --> H[Asynchronous Processing/ETL]
        E -- Cache (Caffeine/Redis) --> I[Caching Layer]
        E -- Monitoring (Actuator/Prometheus) --> J[Monitoring System]
    end

    subgraph CI/CD Pipeline
        K[Developer] --> L(Git Repository)
        L --> M(Jenkins/GitHub Actions)
        M --> N(Docker Registry)
        M --> O(Kubernetes/Cloud Deployment)
    end
```

## 3. Component Breakdown

### 3.1. Frontend (React/TypeScript)

- **Purpose**: Provides the user interface for interacting with the DataVizPro platform.
- **Key Technologies**: React 18+, TypeScript, React Router DOM, Axios, Tailwind CSS, Apache Echarts.
- **Structure**:
    - **`pages/`**: Top-level components representing distinct application views (Login, Register, Dashboard List, Dashboard Editor, Visualization Editor, Data Source Manager).
    - **`components/`**: Reusable UI elements (Navbar, Buttons, Forms, Modals, Loading Spinners, Generic Chart Renderer).
    - **`auth/`**: Authentication context and related utilities.
    - **`api/`**: Centralized Axios client for making API requests to the backend.
    - **`types/`**: TypeScript interfaces for data transfer objects (DTOs) mirroring backend entities.
    - **`utils/`**: Helper functions (e.g., local storage management for JWT).
- **Interactions**: Communicates exclusively with the Backend API via RESTful calls. Handles user input, displays data, and manages client-side routing and state.

### 3.2. Backend (Spring Boot)

- **Purpose**: Exposes the RESTful API, handles business logic, data persistence, and integration with external data sources.
- **Key Technologies**: Java 17+, Spring Boot 3.x, Spring Security, JWT, Spring Data JPA, Hibernate, PostgreSQL, Flyway, Lombok, Caffeine.
- **Architecture Layers**:
    - **`Controller` Layer**: Exposes REST endpoints (`@RestController`). Handles HTTP requests, input validation, and delegates to the `Service` layer.
    - **`Service` Layer**: Contains the core business logic. Orchestrates interactions between repositories, manages transactions, and applies domain-specific rules. Implements caching and rate limiting.
    - **`Repository` Layer**: Abstracts data access. Uses Spring Data JPA to interact with the PostgreSQL database.
    - **`Entity` Layer**: JPA-annotated Plain Old Java Objects (POJOs) representing database tables.
    - **`Configuration` Layer**: Spring configurations for security, JWT, caching, Flyway, etc.
    - **`Shared` Layer**: Common DTOs, custom exceptions, and global exception handling (`@ControllerAdvice`).
    - **`Data Connector` Module**: A pluggable module responsible for connecting to and querying various external data sources (e.g., `JdbcDataConnectorService` for SQL databases).
- **Core Modules**:
    - **`auth`**: Manages user registration, login, JWT token generation/validation, and user details.
    - **`datasource`**: Handles CRUD operations for defining and managing connections to external data sources.
    - **`dashboard`**: Manages the creation, retrieval, update, and deletion of dashboards, including their layout definitions.
    - **`visualization`**: Manages the definition of individual visualizations (chart type, data source, query configuration, chart specific options).
- **Security**: JWT-based authentication and Role-Based Access Control (RBAC) using Spring Security. `@PreAuthorize` annotations ensure method-level security.
- **Data Processing**: The `DataConnectorService` is responsible for dynamically connecting to user-defined data sources and executing queries. This involves careful security considerations (e.g., SQL injection prevention, connection pooling).

### 3.3. Database (PostgreSQL)

- **Purpose**: Stores all application-specific metadata (users, roles, data source connections, dashboard layouts, visualization configurations).
- **Technology**: PostgreSQL (Relational Database).
- **Schema**: Defined through Flyway migration scripts. Includes tables for `app_user`, `user_roles`, `data_source`, `dashboard`, `visualization`.
- **Migration**: Flyway manages schema evolution, ensuring version control for database changes.
- **Optimization**: Indexes on foreign keys and frequently queried columns, proper relationships between entities.

## 4. Cross-Cutting Concerns

### 4.1. Authentication & Authorization

- **Mechanism**: JWT (JSON Web Tokens) are used for stateless authentication.
- **Flow**:
    1. User authenticates with username/password via `/api/v1/auth/authenticate`.
    2. Backend generates a JWT token and returns it.
    3. Frontend stores the token (e.g., in Local Storage) and sends it in the `Authorization: Bearer <token>` header for subsequent requests.
    4. Spring Security's `JwtAuthFilter` intercepts requests, validates the token, and sets the `SecurityContext`.
- **RBAC**: Users are assigned `Role`s (USER, ADMIN, VIEWER). Spring Security's `@PreAuthorize` is used at the method level to enforce access rules (e.g., `@PreAuthorize("hasRole('ADMIN') or @dataSourceService.isOwner(#id, authentication.name)")`).

### 4.2. Configuration & Environment Management

- **Backend**: `application.yml` for properties. Externalized sensitive configurations (DB credentials, JWT secret) via environment variables (`${VAR_NAME:defaultValue}`).
- **Frontend**: `.env` files and Vite's environment variable loading for API base URLs.
- **Docker**: `docker-compose.yml` orchestrates services and sets environment variables for containers.

### 4.3. Testing & Quality Assurance

- **Unit Tests**: Focus on individual components (services, utilities) in isolation using Mockito (backend) and Jest/React Testing Library (frontend).
- **Integration Tests**: Verify interactions between components (e.g., service-repository, controller-service) using `@SpringBootTest` and Testcontainers (for actual database interaction).
- **API Tests**: Validate REST API endpoints using MockMvc or RestAssured.
- **Coverage**: JaCoCo (backend) and Jest (frontend) enforce minimum test coverage thresholds (e.g., 80%).

### 4.4. Logging & Monitoring

- **Logging**: SLF4J with Logback in the backend for structured logging. Configurable log levels.
- **Monitoring**: Spring Boot Actuator exposes health checks, metrics, and other operational information, which can be scraped by tools like Prometheus and visualized in Grafana.

### 4.5. Error Handling

- **Backend**: Global `@ControllerAdvice` (`GlobalExceptionHandler`) catches specific exceptions (e.g., `ResourceNotFoundException`, `BadRequestException`, `MethodArgumentNotValidException`, `AccessDeniedException`) and returns standardized `ApiResponse` objects with appropriate HTTP status codes.
- **Frontend**: API client handles error responses, displaying user-friendly messages.

### 4.6. Caching Layer

- **Mechanism**: Spring Cache abstraction with Caffeine as the in-memory cache provider.
- **Usage**: Applied to frequently accessed but relatively static data (e.g., lists of data sources, dashboard metadata) using `@Cacheable` annotations. Configurable expiry and size.

### 4.7. Rate Limiting

- **Mechanism**: Custom Spring Web MVC `HandlerInterceptor` (`RateLimitInterceptor`) implemented using a Guava Cache (acting as a time-window counter).
- **Functionality**: Limits the number of requests from a specific IP address within a time window to prevent abuse or overload. Returns HTTP 429 (Too Many Requests) if exceeded.

## 5. Deployment

- **Containerization**: Both backend and frontend are containerized using Docker.
- **Orchestration**: `docker-compose` for local development. For production, deployment to Kubernetes or a similar container orchestration platform is envisioned.
- **CI/CD**: A Jenkinsfile provides a blueprint for a CI/CD pipeline, automating build, test, Docker image creation, and deployment.

## 6. Future Enhancements

- **More Data Connectors**: Support for NoSQL databases (MongoDB, Cassandra), cloud data warehouses (Snowflake, BigQuery), APIs (REST, GraphQL).
- **Advanced Visualization Types**: Custom charts, geospatial visualizations.
- **Data Transformation**: ETL capabilities within the platform to prepare data for visualization.
- **Collaboration Features**: Sharing dashboards with specific users/groups, commenting, version control for dashboards.
- **Alerting**: Set up alerts based on data thresholds.
- **Tenant Isolation**: Multi-tenancy support for SaaS deployments.
- **Cloud-Native Services**: Integration with specific cloud provider services (e.g., AWS S3 for static assets, RDS for database, EKS for Kubernetes).
```