```markdown
# Architecture Documentation: Database Performance Monitor & Optimizer

This document outlines the high-level architecture, component breakdown, and technology choices for the Database Performance Monitor & Optimizer application.

## 1. High-Level Architecture

The application follows a standard **client-server (monolithic-ish) architecture** with a clear separation between the frontend and backend, deployed as containerized services. It interacts with both its own internal database for application data (users, connection profiles) and external PostgreSQL databases for monitoring and optimization tasks.

```mermaid
graph TD
    User -->|Browser| Frontend
    Frontend -->|HTTP(S) API| Backend
    Backend -->|PostgreSQL (TypeORM)| App_DB(Application Database)
    Backend -->|Redis (Caching)| Redis
    Backend -->|PostgreSQL (pg client)| External_DB_1(External Target DB 1)
    Backend -->|PostgreSQL (pg client)| External_DB_2(External Target DB 2)
    Backend -->|PostgreSQL (pg client)| External_DB_N(External Target DB N)

    subgraph Infrastructure
        App_DB
        Redis
    end
```

**Key Architectural Decisions:**

*   **Microservices vs. Monolith:** For initial development and given the scope, a "smart monolith" (single backend service) is chosen. This simplifies deployment and development overhead. Horizontal scaling can be achieved by running multiple instances of the backend.
*   **API-driven:** Strict API contract between frontend and backend.
*   **Containerization:** Docker for consistency across environments (development, staging, production).
*   **PostgreSQL as Application DB:** Robust, feature-rich, and widely supported.
*   **Redis for Caching:** Reduces load on the application database and external databases by caching frequently accessed, less volatile data (e.g., connection lists, schema details).
*   **Dynamic PG Client Pools:** To manage connections to multiple external databases efficiently, a dynamic pooling mechanism is implemented in the backend.

## 2. Component Breakdown

### 2.1 Frontend (React, TypeScript)

*   **Framework:** React v18
*   **Language:** TypeScript
*   **UI Library:** Chakra UI (for rapid development, accessibility, and responsive design)
*   **Routing:** React Router DOM
*   **API Client:** Axios (with interceptors for authentication)
*   **State Management:** React Context API (for authentication state), local component state, and React Query/SWR pattern for data fetching.

**Modules:**
*   **Auth:** Login, Register pages, authentication context.
*   **Components:** Reusable UI elements (Navbar, Modals, Forms).
*   **Pages:** Main application views (Home, Connections List, Database Monitor).
*   **API Client:** Centralized Axios instance with JWT interceptors.

### 2.2 Backend (Node.js, TypeScript, Express)

*   **Runtime:** Node.js v18+
*   **Language:** TypeScript
*   **Web Framework:** Express.js
*   **ORM:** TypeORM (for interaction with the application's PostgreSQL database)
*   **Database Driver (for external DBs):** `pg` (direct client for dynamic connections)
*   **Caching:** Redis client (`redis` package)
*   **Authentication:** `jsonwebtoken`, `bcrypt` (for password hashing)
*   **Validation:** `zod`
*   **Logging:** Winston
*   **Security:** `helmet`, `cors`, `express-rate-limit`
*   **Environment Variables:** `dotenv`

**Modules:**
*   **`auth`:** Handles user authentication (login, JWT generation).
*   **`users`:** Manages application users (registration, profile).
*   **`database-connections`:** CRUD operations for storing and retrieving external database connection credentials. Passwords are (conceptually) symmetrically encrypted for storage.
*   **`database-monitor`:** Core logic for interacting with external PostgreSQL databases:
    *   Dynamic `pg.Pool` management.
    *   Fetches `pg_stat_activity` for active/slow queries.
    *   Executes `EXPLAIN ANALYZE`.
    *   Queries `pg_stat_user_indexes` and `pg_get_indexdef` for index management.
    *   Queries `information_schema` for schema browsing.
*   **`shared`:** Contains common middleware (authentication, error handling, rate limiting), utilities (logger, Redis client), and custom error classes (`HttpError`).
*   **`config`:** Centralized application configuration.
*   **`migrations`:** TypeORM migration files for the application database schema.
*   **`seeds`:** Initial data population scripts for the application database.

### 2.3 Databases

*   **Application Database (PostgreSQL):**
    *   Stores application-specific data: Users, Database Connection Profiles.
    *   Accessed via TypeORM.
*   **Redis:**
    *   Used as a cache for frequently accessed or computationally expensive data (e.g., lists of DB connections, external DB schema details, active query results for a short period).
    *   Could also be used for session management (though JWT tokens are stateless).

*   **External Target Databases (PostgreSQL):**
    *   These are the databases the application monitors and optimizes.
    *   Connections are established dynamically by the backend using the `pg` client based on user-provided credentials.

## 3. Data Flow

1.  **User Authentication:**
    *   User enters credentials on the Frontend.
    *   Frontend sends `POST /api/auth/login` to Backend.
    *   Backend validates credentials against `App_DB` (hashed password comparison).
    *   If valid, Backend generates a JWT token and sends it back to the Frontend.
    *   Frontend stores JWT in `localStorage` and includes it in `Authorization` header for subsequent requests.

2.  **Managing DB Connections:**
    *   User creates/updates/deletes connection profiles via Frontend forms.
    *   Frontend sends requests to `POST/GET/PUT/DELETE /api/connections` endpoints.
    *   Backend validates input, encrypts sensitive data (like passwords), and stores/retrieves connection profiles in `App_DB`.
    *   Redis cache is invalidated/updated for user's connections.

3.  **Monitoring External DBs:**
    *   User navigates to a specific connection's monitor page on the Frontend.
    *   Frontend sends requests to `GET /api/monitor/:connectionId/active-queries`, `GET /api/monitor/:connectionId/indexes`, etc.
    *   Backend retrieves connection details (including decrypted password) from `App_DB`.
    *   Backend uses a `pg.Pool` (creating one if it doesn't exist for that `connectionId`) to establish a connection to the `External_DB`.
    *   Backend executes SQL queries (e.g., `SELECT * FROM pg_stat_activity;` or `EXPLAIN ANALYZE ...`) directly on the `External_DB`.
    *   Results are returned to the Frontend, possibly cached in Redis for short durations.

## 4. Scalability Considerations

*   **Backend:** Stateless design (JWT for auth, Redis for cache) allows for easy horizontal scaling by running multiple instances behind a load balancer. The dynamic `pg.Pool` per connection ID manages load to external DBs.
*   **Frontend:** Standard React build, can be served from a CDN or static file server for scalability.
*   **Application Database:** Can be scaled vertically or horizontally (e.g., read replicas) as needed.
*   **Redis:** Can be clustered for high availability and performance.

## 5. Security Aspects

*   **Authentication:** JWT for stateless, secure authentication.
*   **Authorization:** Role-based access control implemented via middleware.
*   **Password Hashing:** `bcrypt` for user passwords in `App_DB`.
*   **DB Connection Passwords:** Stored encrypted in `App_DB`. For production, a Key Management System (KMS) or secure environment variables would be used for symmetric encryption keys.
*   **HTTPS:** Assumed in production for all client-server communication.
*   **Input Validation:** `zod` schema validation on API endpoints to prevent common injection attacks and ensure data integrity.
*   **Rate Limiting:** Protects against brute-force attacks and abuse.
*   **Helmet:** Adds various security HTTP headers.
*   **CORS:** Configured to allow specific origins.

## 6. Future Enhancements

*   **Advanced Query Optimization Suggestions:** Integrate AI/ML models or more sophisticated rule-based systems to proactively suggest index recommendations, query rewrites, or partitioning strategies.
*   **Historical Performance Data:** Store and visualize historical metrics (CPU, memory, disk I/O, query execution times) for trend analysis.
*   **Alerting:** Configure thresholds and send notifications (email, Slack) for critical performance events.
*   **Database Agnostic:** Support other database types (MySQL, SQL Server, MongoDB) by abstracting the monitoring logic.
*   **Multi-tenancy:** Enhance isolation for users to manage their own separate sets of external database connections securely.
*   **Dashboard Customization:** Allow users to build custom dashboards with specific metrics.

---
```