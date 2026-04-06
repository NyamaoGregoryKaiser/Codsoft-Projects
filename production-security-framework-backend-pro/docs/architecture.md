# Architecture Documentation - Secure C++ Web Application

This document outlines the high-level architecture of the Secure C++ Web Application, focusing on its components, interactions, and design principles.

## 1. Overview

The application follows a modular, three-tier architecture, deployed using Docker containers. It consists of a client-side frontend, a C++ backend API server, and a PostgreSQL database. An Nginx reverse proxy sits in front, handling static file serving, SSL termination, and request routing.

```
+-------------------------------------------------------------------------------------------------------+
|                                              Internet                                                 |
+-------------------------------------------------------------------------------------------------------+
        | (HTTPS)
        |
+---------------------+
|                     |
|       Nginx         |
|  (Reverse Proxy,    |
|   SSL Termination,  | <-- Security Headers, Static File Server (Frontend)
|   Rate Limiting     |
|   (basic/proxy))    |
+---------------------+
        | (HTTP)      | (HTTP)
        |             |
        |             |   /api/*
        |             +---------------------------------+
        |                                               |
        |                                               |
+---------------------+                          +---------------------+
|                     |                          |                     |
|  Frontend           |                          |    Backend API      |
|  (Vanilla JS, HTML, |                          |    (C++ Crow App)   |
|   CSS)              |                          |                     |
|                     |                          |  - Auth, RBAC,      |
|  - User Interface   |                          |    Rate Limit,      |
|  - API Consumption  |                          |    Error Handling   |
|                     |                          |    Middlewares      |
|                     |                          |  - Controllers      |
|                     |                          |    (Auth, User)     |
|                     |                          |  - Services         |
|                     |                          |    (Auth, User)     |
|                     |                          |  - Repositories     |
|                     |                          |    (User, Product)  |
|                     |                          |  - Utilities        |
|                     |                          |    (JWT, Argon2,    |
|                     |                          |    Logger, Cache)   |
+---------------------+                          +---------------------+
                                                           | (TCP/IP)
                                                           |
                                                   +------------------+
                                                   |                  |
                                                   |    PostgreSQL    |
                                                   |    (Database)    |
                                                   |                  |
                                                   |  - User Data     |
                                                   |  - Product Data  |
                                                   |  - Schema,       |
                                                   |    Migrations    |
                                                   |    Seed Data     |
                                                   |                  |
                                                   +------------------+
```

## 2. Components

### 2.1. Frontend
*   **Technology:** Vanilla HTML, CSS, JavaScript.
*   **Role:** Provides the user interface (UI) and user experience (UX). It interacts with the backend API to perform operations like user registration, login, and accessing protected resources. It's designed to be lightweight and demonstrate API consumption, not a full-fledged SPA framework.
*   **Deployment:** Served statically by the Nginx container.

### 2.2. Nginx (Reverse Proxy & Web Server)
*   **Technology:** Nginx stable-alpine.
*   **Role:**
    *   **SSL Termination:** Handles HTTPS traffic from clients, decrypts it, and forwards plain HTTP requests to the backend.
    *   **Static File Serving:** Serves the frontend's static assets (HTML, CSS, JS, images).
    *   **API Gateway:** Routes `/api/*` requests to the C++ backend service.
    *   **Security Headers:** Adds various HTTP security headers (HSTS, CSP, X-Frame-Options, etc.).
    *   **Basic Rate Limiting:** Can implement rudimentary IP-based rate limiting before requests reach the backend.

### 2.3. C++ Backend API
*   **Technology:** C++20, Crow web framework, `libsodium`, `jwt-cpp`, `spdlog`, `pqxx`, `nlohmann/json`.
*   **Role:** The core business logic and data processing engine. It exposes a RESTful API for client interaction.
*   **Internal Structure:**
    *   **Controllers:** Handle incoming HTTP requests, parse input, and delegate to services.
    *   **Services:** Encapsulate business logic, coordinate multiple repository operations, and apply domain rules.
    *   **Repositories:** Abstract database access, mapping between application-specific models and database entities. Uses `pqxx` for PostgreSQL interactions.
    *   **Models:** Data structures representing application entities (e.g., `User`, `Product`).
    *   **Utilities:**
        *   `AppConfig`: Manages environment-based configuration.
        *   `Argon2Hasher`: Provides secure password hashing.
        *   `JwtManager`: Handles JWT creation and verification.
        *   `Logger`: Structured logging for application events and errors.
        *   `CustomExceptions`: Defines custom exception types for consistent error handling.
        *   `RateLimiter`: Implements the token bucket algorithm for API rate limiting.
    *   **Middleware:**
        *   `ErrorHandler`: Global exception catching and standardized JSON error responses.
        *   `RateLimit`: Enforces request rate limits.
        *   `Auth`: Validates JWTs and extracts user identity/role.
        *   `RBAC`: Performs role-based access control for specific routes.

### 2.4. PostgreSQL Database
*   **Technology:** PostgreSQL 16.
*   **Role:** Persistent storage for application data (users, products, etc.).
*   **Features:**
    *   **Schema Definition:** Defines tables, relationships, and constraints.
    *   **Migrations:** Scripts to evolve the database schema over time.
    *   **Seed Data:** Initial data for development and testing.
    *   **`uuid-ossp` Extension:** Used for generating UUIDs for primary keys.
    *   **Health Checks:** Configured in `docker-compose.yml` to ensure the database is ready before the backend starts.

## 3. Communication Flows

1.  **Client to Nginx:** Frontend (browser) requests hit Nginx over HTTPS (port 443).
2.  **Nginx to Frontend:** Nginx serves static assets directly from `/usr/share/nginx/html`.
3.  **Nginx to Backend:** API requests (e.g., `/api/auth/login`) are proxied by Nginx to the C++ backend service over HTTP (port 8080 internally). Nginx adds `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers.
4.  **Backend to Database:** The C++ backend connects to the PostgreSQL database using `pqxx` (TCP/IP on port 5432 internally). All database interactions use parameterized queries to prevent SQL injection.

## 4. Security Architecture Highlights

*   **Defense in Depth:** Multiple layers of security (Nginx, Backend Middlewares, Database).
*   **Authentication & Authorization:** Strong password hashing (Argon2), JWTs (Access/Refresh), and granular RBAC.
*   **Secure Communication:** HTTPS from client to Nginx, with appropriate SSL/TLS configurations and security headers.
*   **Input Validation:** At controller and service layers, complemented by database constraints.
*   **Error Management:** Consistent, non-revealing error messages via global error handling.
*   **Logging:** Detailed, structured logs for auditing and incident response.
*   **Rate Limiting:** Protects against various attack vectors (brute force, DoS).
*   **Secrets Management:** Environment variables for sensitive configuration.

## 5. Scalability Considerations

*   **Stateless Backend:** The C++ backend is stateless (JWTs are self-contained), allowing for easy horizontal scaling of backend instances.
*   **Nginx Load Balancing:** Nginx can be configured to load balance requests across multiple backend instances.
*   **Database Scaling:** PostgreSQL can be scaled vertically or horizontally (read replicas, sharding) as needed.
*   **Caching:** The in-memory cache can be extended with external distributed caches (e.g., Redis) for improved performance across multiple instances.

This architecture provides a solid foundation for a secure, performant, and scalable web application.