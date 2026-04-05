# Architecture Documentation - Web Scraping Tools System

## 1. High-Level Architecture

The system follows a microservices-inspired, layered architecture, dividing concerns into a frontend, a backend API, a database, and a job queue/cache. Docker Compose orchestrates these services for local development and simplified deployment.

```mermaid
graph TD
    UserInterface[Web Browser (React.js Frontend)] -->|HTTP/S| API_Gateway(Nginx/Load Balancer)
    API_Gateway -->|HTTP/S| BackendAPI(Node.js/Express.js Backend)

    subgraph Backend Services
        BackendAPI --> DB(PostgreSQL Database)
        BackendAPI --> Redis(Redis Cache/Queue)
        Redis -- Pub/Sub --> BullMQ_Worker(BullMQ Worker)
        BullMQ_Worker --> Puppeteer[Puppeteer Scraping Engine]
        Puppeteer --> Internet(Target Websites)
        Puppeteer --> DB
    end

    BackendAPI --> Monitoring(Logging/Monitoring)
    BullMQ_Worker --> Monitoring
```

## 2. Component Breakdown

### 2.1. Frontend (React.js)

*   **Purpose:** Provides a user-friendly interface for managing scraping targets, viewing jobs, and analyzing scraped data.
*   **Technology:** React.js, React Router, Axios for API communication.
*   **Key Features:**
    *   User authentication (Login, Logout).
    *   Dashboard for an overview.
    *   CRUD operations for Scraping Targets (URL, selectors, schedule).
    *   Viewing of Scrape Jobs (status, history).
    *   Display of Scraped Data.
    *   Responsive UI for various devices.

### 2.2. Backend API (Node.js/Express.js)

*   **Purpose:** Serves as the central API gateway for the frontend and manages core business logic, database interactions, and job orchestration.
*   **Technology:** Node.js, Express.js, Sequelize ORM.
*   **Layers/Modules:**
    *   **`config/`:** Centralized application configuration (DB, JWT, Redis, Puppeteer, etc.).
    *   **`db/`:** Database models (Sequelize), migrations, and seeders.
        *   **Models:** `User`, `Target`, `ScrapeJob`, `ScrapedData`.
        *   **Associations:** Defined relationships between models.
    *   **`middlewares/`:** Express middleware for cross-cutting concerns.
        *   **Authentication:** JWT verification, role-based authorization.
        *   **Error Handling:** Centralized `ApiError` handling.
        *   **Rate Limiting:** Protects API from excessive requests.
        *   **Caching:** Redis-backed response caching for read-heavy endpoints.
    *   **`routes/`:** API route definitions (`/api/auth`, `/api/users`, `/api/targets`, `/api/scrape-jobs`, `/api/scraped-data`).
    *   **`controllers/`:** Handle incoming requests, validate input, and orchestrate service calls. Keep logic thin.
    *   **`services/`:** Encapsulate core business logic and database interactions.
        *   `auth.service`: User registration, login, token generation.
        *   `user.service`: User CRUD operations.
        *   `target.service`: Scraping target CRUD, interacts with job scheduler.
        *   `scrapeJob.service`: Manages scrape job records and triggers BullMQ jobs.
        *   `scrapedData.service`: Retrieves and manages scraped data.
        *   `scraping.service`: Contains the Puppeteer logic for web scraping.
        *   `jobScheduler.service`: Integrates with BullMQ to add/manage jobs.
    *   **`utils/`:** Helper utilities (Logger, JWT helper, custom `ApiError`).
    *   **`workers/`:** BullMQ worker consumers (specifically `scrapeWorker.js`).

### 2.3. Database (PostgreSQL)

*   **Purpose:** Persistent storage for user information, scraping targets, job metadata, and all collected scraped data.
*   **Technology:** PostgreSQL.
*   **Schema Design Highlights:**
    *   `users`: Stores user credentials and roles (admin/user).
    *   `targets`: Defines what to scrape (URL, CSS selectors, schedule).
    *   `scrape_jobs`: Records each instance of a scraping operation (status, outcome).
    *   `scraped_data`: Stores the actual data extracted, using `JSONB` for flexible, schema-less storage of scraped content.
*   **ORM:** Sequelize for object-relational mapping, migrations, and seeders.
*   **Optimization:** Indexes on frequently queried columns, eager loading for related data, pagination.

### 2.4. Job Queue & Cache (Redis)

*   **Purpose:**
    *   **Job Queue:** Provides robust, persistent, and distributed job processing for scraping tasks.
    *   **Cache:** Stores frequently accessed data (e.g., target lists, recently scraped data) to improve API response times and reduce database load.
*   **Technology:** Redis.
*   **Integration:**
    *   **BullMQ:** Uses Redis as its backend for job queues, repeatable jobs (scheduling), and worker management.
    *   **`connect-redis` / `redis` client:** Used by Express middleware for session management (optional, though not fully implemented in example) and general-purpose caching.

### 2.5. Scraping Engine (Puppeteer)

*   **Purpose:** Headless browser automation for performing actual web scraping.
*   **Technology:** Puppeteer (Node.js library for controlling Chromium/Firefox).
*   **Workflow:** Triggered by BullMQ workers, launches a browser instance, navigates to the target URL, executes JavaScript if needed, extracts data based on provided CSS selectors, and returns the structured data.
*   **Configuration:** Configurable headless mode and browser arguments for Docker environments.

### 2.6. Logging and Monitoring

*   **Technology:** Winston (Backend).
*   **Implementation:** Centralized logging with different log levels (debug, info, error). Logs are output to console by default but can be configured for file, external services (e.g., ELK stack, Datadog) in production.
*   **Monitoring:** While full monitoring isn't coded, the logging provides the foundation. In a production setting, integrate with APM tools (e.g., Prometheus/Grafana, Datadog, New Relic) for system health, performance metrics, and error tracking.

### 2.7. Authentication and Authorization

*   **Authentication:** JSON Web Tokens (JWT) for stateless authentication. Users log in, receive an access token, and include it in subsequent requests.
*   **Authorization:** Role-Based Access Control (RBAC).
    *   `admin` role: Full access to all resources (users, targets, jobs, data).
    *   `user` role: Can manage their own targets, view their own jobs and data.
    *   Implemented via Express middleware (`auth.middleware.js`) that verifies the JWT and checks user roles against required permissions for each route.

## 3. Data Flow

1.  **User Interaction (Frontend):** A user logs in, creates a new `Target` (specifying URL, selectors, optional cron `schedule`), or triggers an immediate `Scrape Job`.
2.  **API Request (Frontend -> Backend):** The React frontend sends an authenticated HTTP request (e.g., POST `/api/targets`, POST `/api/scrape-jobs/:targetId/run`) to the Backend API.
3.  **Authentication/Authorization (Backend):** The backend's `auth.middleware` verifies the JWT and checks user permissions. `rateLimit.middleware` prevents abuse.
4.  **Business Logic (Backend Services):**
    *   For `Target` creation/update, `target.service` interacts with `db/models/Target` to persist data. If a `schedule` is provided, `jobScheduler.service` is called to register a repeatable job with BullMQ.
    *   For triggering a `Scrape Job`, `scrapeJob.service` calls `jobScheduler.service` to add an immediate job to the BullMQ queue.
5.  **Job Queuing (BullMQ/Redis):** `jobScheduler.service` adds job payloads (e.g., `{ targetId: '...', userId: '...' }`) to the BullMQ queue in Redis.
6.  **Job Processing (BullMQ Worker):**
    *   The `scrapeWorker` (a separate process or thread) continuously polls the BullMQ queue.
    *   When a job is picked up, it updates the `ScrapeJob` status in PostgreSQL to `in_progress`.
    *   It then retrieves the `Target` details from PostgreSQL.
    *   It calls `scraping.service.scrapeUrl(target.url, target.selectors)`.
7.  **Web Scraping (Puppeteer):** `scraping.service` launches a headless Puppeteer browser, navigates to the `target.url`, and extracts data using the specified `selectors`.
8.  **Data Storage (Puppeteer/Worker -> DB):** The scraped data is returned to the `scrapeWorker`, which then persists it as a new `ScrapedData` record (JSONB) in PostgreSQL, linked to the `ScrapeJob` and `Target`.
9.  **Job Completion/Failure (Worker -> DB):** The `scrapeWorker` updates the `ScrapeJob` status to `completed` or `failed` in PostgreSQL, including any results or error details.
10. **Data Retrieval (Frontend -> Backend -> DB/Cache):** When a user requests to view `Scraped Data` or `Scrape Jobs`, the frontend makes API calls. The `cache.middleware` may serve cached responses from Redis. Otherwise, the `scrapedData.service` or `scrapeJob.service` fetches the latest data from PostgreSQL.

## 4. Scalability Considerations

*   **Stateless Backend:** The Express.js backend is largely stateless (JWT handles authentication), allowing for easy horizontal scaling.
*   **Distributed Job Queue (BullMQ):** BullMQ/Redis acts as a central message broker, decoupling job creation from job execution. This allows:
    *   **Backend scaling:** Multiple API instances can add jobs to the queue.
    *   **Worker scaling:** Multiple `scrapeWorker` instances can be run across different servers or containers to process jobs concurrently, handling high load.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally using replication (read replicas) for read-heavy workloads. Sharding might be considered for extremely large datasets.
*   **Cache (Redis):** Reduces load on the database, improving API response times, and can be clustered for high availability and scalability.
*   **Puppeteer:** Scraping is resource-intensive. Dedicated `scrapeWorker` containers/servers help isolate this load. Consider using proxy services for large-scale scraping to avoid IP blocks.

## 5. Security Considerations

*   **Authentication:** JWT with secure secret, bcrypt for password hashing.
*   **Authorization:** Role-based access control to protect resources.
*   **Input Validation:** Essential for all API endpoints (though not exhaustively implemented in examples, typically done with libraries like Joi or Express-validator).
*   **CORS:** Properly configured to allow access only from trusted frontend origins.
*   **Helmet.js:** Used to set various HTTP headers for improved security.
*   **Rate Limiting:** Protects against brute-force attacks and API abuse.
*   **Environment Variables:** Sensitive information (database credentials, JWT secret) stored in environment variables, not committed to source control.
*   **Puppeteer Sandboxing:** Running Puppeteer with `--no-sandbox` is generally discouraged in untrusted environments. For multi-tenant or untrusted user-defined URLs, consider dedicated sandboxed environments (e.g., separate containers per scrape job, or cloud functions) and strict URL validation. The current Docker setup includes `--no-sandbox` for compatibility on some hosts, but security should be reviewed.
*   **SQL Injection:** Sequelize ORM helps prevent SQL injection by parameterizing queries.

## 6. Development Workflow

*   **Docker Compose:** Provides a consistent development environment for all services.
*   **Migrations:** Database schema changes are managed via Sequelize migrations.
*   **Testing:** Comprehensive test suite (unit, integration, API) to ensure code quality and prevent regressions.
*   **CI/CD:** GitHub Actions pipeline for automated testing and (example) deployment.
```