```markdown
# Mobile Backend Architecture Documentation

This document describes the overall architecture of the Mobile Backend system, detailing its components, their interactions, and the underlying technologies.

## 1. Overview

The Mobile Backend is a RESTful API service designed to support mobile applications. It provides functionalities for user authentication, user management, product catalog management, and order processing. The system is built with C++ using the Drogon web framework, emphasizing high performance, scalability, and robust error handling.

## 2. Technology Stack

-   **Core Application**: C++17 with Drogon Web Framework
-   **Database**: PostgreSQL
-   **Caching/Session Management**: Redis
-   **Logging**: spdlog
-   **Authentication**: JWT (JSON Web Tokens)
-   **Password Hashing**: bcrypt
-   **Containerization**: Docker, Docker Compose
-   **Build System**: CMake
-   **Testing**: Google Test
-   **API Documentation**: Markdown (can be converted to OpenAPI/Swagger)
-   **CI/CD**: GitHub Actions (example)

## 3. High-Level Architecture

```
+----------------+       +----------------+       +-------------------+
|                |       |                |       |                   |
| Mobile Client  | <---> | Load Balancer/ | <---> |  Mobile Backend   |
| (iOS/Android)  |       | API Gateway    |       |  (Drogon C++ App) |
|                |       | (Nginx/Envoy)  |       |                   |
+----------------+       +----------------+       +--------^---^------+
                                                            |   |
                                                            |   | (PostgreSQL Client)
                                                            |   |
                                                      +-----v---v-----+
                                                      |                 |
                                                      |     Database    |
                                                      |   (PostgreSQL)  |
                                                      +-----------------+
                                                            ^
                                                            | (Hiredis Client)
                                                      +-----v-----+
                                                      |           |
                                                      |   Cache   |
                                                      |  (Redis)  |
                                                      +-----------+
```

**Key Components**:

1.  **Mobile Client**: The native iOS or Android application that consumes the RESTful API.
2.  **Load Balancer/API Gateway**: (Optional, but recommended for production) Handles traffic distribution, SSL termination, and potentially other API management tasks (e.g., Nginx, Envoy, AWS API Gateway). For simplicity, our `docker-compose.yml` directly exposes the backend.
3.  **Mobile Backend (Drogon C++ App)**: The core C++ application. It's responsible for:
    -   Exposing RESTful API endpoints.
    -   Implementing business logic (User, Product, Order management).
    -   Authenticating and authorizing requests.
    -   Interacting with the database and cache.
    -   Logging and error handling.
    -   Rate limiting incoming requests.
4.  **Database (PostgreSQL)**: The primary data store for persistent application data (users, products, orders).
5.  **Cache (Redis)**: Used for storing frequently accessed data, user session tokens (JWT blacklisting/revocation), and rate limiting counters to improve performance and reduce database load.

## 4. Detailed Backend Architecture (C++ Drogon App)

The C++ application is structured into several logical modules, following a layered architecture inspired by MVC (Model-View-Controller) and Repository patterns.

```
+-------------------------------------------------------------------------------------------------------------------+
|                                        Mobile Backend (Drogon C++ Application)                                    |
| +---------------------+   +---------------------+   +---------------------+   +---------------------+           |
| |                     |   |                     |   |                     |   |                     |           |
| |     Controllers     |-->|       Filters       |-->|       Services      |-->|     Repositories    |           |
| | (API Endpoints)     |   | (Auth, Rate Limit)  |   | (Business Logic)    |   | (DB Access, CRUD)   |           |
| +---------------------+   +---------------------+   +---------------------+   +---------^-----------+           |
|            ^                                                                               |                      |
|            |                                                                               |                      |
|            | (Routes defined in main.cc)                                              (ORM/DB Client)          |
|            |                                                                               |                      |
| +----------v----------+                                                         +----------v-----------+           |
| |                     |                                                         |                      |           |
| |       Main.cc       |-------------------------------------------------------->|     DBManager        |           |
| | (App Configuration) |                                                         | (Connection Pool)    |           |
| +---------------------+                                                         +----------^-----------+           |
|                                                                                            |                      |
|                                                                                            | (Hiredis Client)     |
|                                                                                  +---------v-----------+           |
|                                                                                  |                     |           |
|                                   +--------------------------------------------->|     CacheService    |           |
|                                   |                                              |  (Redis Operations) |           |
|                                   |                                              +---------------------+           |
| +---------------------+           |                                                                               |
| |                     |           |                                                                               |
| |     ConfigManager   |<----------+                                                                               |
| |  (.env, drogon_config) |                                                                                           |
| +---------------------+                                                                                         |
|                                                                                                                   |
| +---------------------+       +---------------------+       +---------------------+                               |
| |                     |       |                     |       |                     |                               |
| |       Logger        |       |    PasswordHasher   |       |      JwtManager     |                               |
| |    (spdlog)         |       |    (bcrypt)         |       |   (jwt-cpp)         |                               |
| +---------------------+       +---------------------+       +---------------------+                               |
+-------------------------------------------------------------------------------------------------------------------+
```

### 4.1. `main.cc`

-   The entry point of the application.
-   Initializes the Drogon web framework.
-   Loads configurations from `ConfigManager` and `drogon_config.json`.
-   Configures the database connection pool (`DBManager`).
-   Registers controllers and filters (middleware) with their respective routes.
-   Initializes the logger and other global utilities.

### 4.2. `config/`

-   **`ConfigManager.h/.cc`**: Handles loading environment variables from the `.env` file, providing a centralized way to access application settings (database credentials, JWT secret, Redis settings, etc.).
-   `drogon_config.json`: Drogon's native configuration file for server settings, logging, and initial DB client setup. Environment variables loaded by `ConfigManager` can override or supplement these.

### 4.3. `utils/`

-   **`Logger.h/.cc`**: A wrapper around `spdlog` for structured, configurable logging across the application.
-   **`PasswordHasher.h/.cc`**: Provides functionalities for securely hashing and verifying passwords using `bcrypt`.
-   **`JwtManager.h/.cc`**: Handles the creation, signing, and verification of JSON Web Tokens (JWTs) for authentication, using `jwt-cpp`.
-   **`Common.h`**: Contains common definitions, utility functions, or error codes.

### 4.4. `models/`

-   Defines plain C++ structs or classes representing the core data entities (User, Product, Order). These are typically simple data containers that map directly to database tables. Drogon's ORM can generate these, but manual definitions offer more control and decoupling.

### 4.5. `database/`

-   **`DBManager.h/.cc`**: Manages the interaction with Drogon's ORM and database client. It ensures proper connection pooling and handles asynchronous database operations.
-   **`repositories/`**:
    -   **`UserRepository.h/.cc`**: Encapsulates CRUD (Create, Read, Update, Delete) operations for `User` entities. It directly interacts with Drogon's ORM or raw SQL queries.
    -   **`ProductRepository.h/.cc`**: Same for `Product` entities.
    -   **`OrderRepository.h/.cc`**: Same for `Order` and `OrderItem` entities, handling complex joins and transactions.
    -   These layers abstract the database access details from the business logic.

### 4.6. `services/`

-   This layer contains the core business logic of the application. Services coordinate operations across multiple repositories and perform validations.
-   **`AuthService.h/.cc`**: Handles user registration (hashing password, storing user), login (verifying password, generating JWT), and potentially token revocation/blacklisting.
-   **`UserService.h/.cc`**: Implements business rules for user management (e.g., preventing duplicate emails, ensuring data consistency).
-   **`ProductService.h/.cc`**: Business logic for product operations (e.g., checking stock, product validation).
-   **`OrderService.h/.cc`**: Complex business logic for order creation (e.g., checking product availability, calculating total amount, creating order items atomically), status updates, and retrieval.
-   **`CacheService.h/.cc`**: Provides an interface for interacting with Redis, used for rate limiting, short-lived data, or possibly JWT blacklisting.

### 4.7. `filters/` (Drogon Middleware)

-   **`AuthFilter.h/.cc`**: A Drogon filter that intercepts requests to protected routes. It validates the JWT in the `Authorization` header, extracts user information, and attaches it to the request context for subsequent controllers. Handles unauthorized (401) and forbidden (403) responses.
-   **`RateLimitFilter.h/.cc`**: Implements rate limiting logic. It uses `CacheService` (Redis) to store request counts per IP or user and rejects requests exceeding predefined thresholds with a `429 Too Many Requests` status.

### 4.8. `controllers/` (Drogon API Endpoints)

-   These are the entry points for external API requests. They handle HTTP requests, parse input, call appropriate services, and format responses.
-   **`AuthController.h/.cc`**: Exposes `/auth/register` and `/auth/login` endpoints.
-   **`UserController.h/.cc`**: Exposes `/users` CRUD endpoints.
-   **`ProductController.h/.cc`**: Exposes `/products` CRUD endpoints.
-   **`OrderController.h/.cc`**: Exposes `/orders` CRUD endpoints, including complex operations for creating orders with items.
-   **`RootController.h/.cc`**: A simple health check or root endpoint.

## 5. Data Flow Example: User Login

1.  **Mobile Client** sends `POST /api/v1/auth/login` with email and password.
2.  **Drogon Controller (`AuthController`)** receives the request.
3.  **`AuthController`** parses the JSON body to extract email and password.
4.  **`AuthController`** calls **`AuthService::loginUser(email, password)`**.
5.  **`AuthService`**:
    -   Calls **`UserRepository::getUserByEmail(email)`** to fetch the user.
    -   Uses **`PasswordHasher::verifyPassword()`** to compare the provided password with the stored hash.
    -   If credentials are valid, calls **`JwtManager::generateToken()`** to create a new JWT, embedding user ID and role.
6.  **`AuthService`** returns the user ID and JWT.
7.  **`AuthController`** constructs a successful JSON response (`200 OK`) containing the user ID and token, and sends it back to the **Mobile Client**.
8.  For subsequent requests to protected routes, the **Mobile Client** includes the JWT in the `Authorization` header.
9.  **Drogon Filter (`AuthFilter`)** intercepts these requests, calls **`JwtManager::verifyToken()`**, extracts the user ID, and injects it into the request context before forwarding to the appropriate controller.

## 6. Scalability and Performance Considerations

-   **Drogon's Asynchronous I/O**: Drogon is built on an asynchronous, event-driven model, allowing it to handle many concurrent connections efficiently without blocking.
-   **Connection Pooling**: Drogon's integrated database client provides connection pooling, reducing the overhead of establishing new connections.
-   **Redis Caching**: Offloads read operations from the database, reducing latency and database load for frequently accessed or computed data. Also used for distributed rate limiting and session management.
-   **Rate Limiting**: Protects backend resources from abuse and helps maintain service availability.
-   **Database Indexing**: Properly indexed tables in PostgreSQL ensure fast data retrieval.
-   **Docker & Orchestration**: Deploying with Docker allows for easy horizontal scaling of the C++ application instances using orchestrators like Kubernetes.
-   **Load Balancing**: A load balancer (e.g., Nginx, Envoy) in front of multiple application instances distributes traffic evenly and provides fault tolerance.
-   **Logging**: `spdlog` is highly performant and supports various sinks (console, file, syslog, etc.), enabling robust observability without significant performance impact.
-   **Stateless Backend**: The use of JWTs makes the backend largely stateless, simplifying horizontal scaling as any server instance can handle any request without relying on shared session state. (Redis is used for *some* shared state, like rate limits, but not for core user sessions).

This architecture provides a solid foundation for a high-performance, scalable, and maintainable mobile backend service.
```