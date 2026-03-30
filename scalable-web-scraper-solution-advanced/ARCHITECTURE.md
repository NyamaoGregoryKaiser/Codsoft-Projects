# Architecture Documentation: Web Scraping Tools System

This document outlines the high-level architecture and key components of the Web Scraping Tools System.

## 1. High-Level Overview

The system is a distributed, full-stack application designed for scalability, resilience, and maintainability. It follows a microservices-like approach, with distinct backend, frontend, database, and background worker components, orchestrated using Docker.

```mermaid
graph TD
    User[Web Browser] -- HTTP/HTTPS --> Frontend[React Frontend (Nginx)]
    Frontend -- REST API (HTTP/HTTPS) --> Backend[FastAPI Backend]

    subgraph Backend Services
        Backend -- DB Connection --> PostgreSQL[PostgreSQL Database]
        Backend -- Enqueues Tasks --> Redis[Redis (Broker/Cache)]
        Redis -- Task Queue --> CeleryWorker[Celery Worker (Playwright)]
        CeleryWorker -- Controls Browser --> WebTarget[Target Websites]
        CeleryWorker -- Stores Results --> PostgreSQL
        CeleryWorker -- Updates Task Status --> Redis
    end

    Backend -- Admin/Monitor --> Flower[Celery Flower (Monitor)]
    CI/CD[GitHub Actions] --> DockerRegistry[Docker Registry]
    DockerRegistry --> K8s[Kubernetes / Docker Compose]
```

## 2. Component Breakdown

### 2.1. Frontend (React)

*   **Technology:** ReactJS, Vite (or Create React App), Tailwind CSS.
*   **Purpose:** Provides a user-friendly web interface for users to:
    *   Authenticate and manage their profiles.
    *   Define new web scrapers with specific URLs and parsing rules (CSS selectors).
    *   Trigger scraping jobs.
    *   Monitor the status of active and completed scraping jobs.
    *   View and filter scraped data.
    *   (Admin-only) Manage other users.
*   **Deployment:** Served by an Nginx container. Communicates with the Backend API via RESTful HTTP requests.

### 2.2. Backend (FastAPI)

*   **Technology:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic.
*   **Purpose:** Serves as the central API gateway and business logic handler.
*   **Key Responsibilities:**
    *   **Authentication & Authorization:** Manages user login, JWT token issuance, and enforces role-based access control.
    *   **CRUD Operations:** Handles requests for creating, reading, updating, and deleting Scrapers, Scraping Jobs, Users, and Scraped Items.
    *   **Task Management:** Receives requests to run scrapers and enqueues them as asynchronous tasks in Celery.
    *   **Data Validation:** Uses Pydantic for robust request and response data validation.
    *   **Caching:** Implements local `async_lru` caching for frequently accessed data and uses Redis for `FastAPILimiter`.
    *   **Rate Limiting:** Protects API endpoints against excessive requests.
    *   **Error Handling:** Provides a centralized middleware for consistent error responses.

### 2.3. Database (PostgreSQL)

*   **Technology:** PostgreSQL 16+.
*   **Purpose:** Persistent storage for all application data.
*   **Schema:**
    *   `users`: Stores user credentials, roles, and profile information.
    *   `scrapers`: Stores definitions of web scrapers (name, URL, parsing rules, owner).
    *   `scraping_jobs`: Tracks individual runs of a scraper (status, timestamps, results, owner, associated scraper).
    *   `scraped_items`: Stores the actual data extracted by scrapers, linked to its scraper and job.
*   **Management:** `SQLAlchemy` as ORM, `Alembic` for database migrations.

### 2.4. Asynchronous Task Queue (Celery & Redis)

*   **Technology:** Celery, Redis.
*   **Purpose:** Decouples long-running scraping tasks from the main API process, ensuring API responsiveness and scalability.
*   **Components:**
    *   **Redis:** Acts as both the **message broker** for Celery (to queue tasks) and the **result backend** (to store task results/status). It also serves as a general-purpose cache for `FastAPILimiter` and potentially other caching needs.
    *   **Celery Worker:** A dedicated process that consumes tasks from the Redis queue. Each worker can execute multiple scraping jobs concurrently (configured via `MAX_CONCURRENT_SCRAPER_RUNS`).
    *   **Celery Flower:** A real-time web-based monitor for Celery tasks, allowing visibility into worker status, task queues, and task history.

### 2.5. Web Scraper (Playwright)

*   **Technology:** Playwright (Python library).
*   **Purpose:** Executes the actual web scraping logic within the Celery worker.
*   **Capabilities:**
    *   **Headless Browser Automation:** Launches a real browser (Chromium by default) in headless mode.
    *   **JavaScript Execution:** Can interact with dynamic, JavaScript-heavy websites.
    *   **User Interaction Mimicry:** Supports clicking buttons, filling forms, waiting for elements, handling pagination, etc.
    *   **Robustness:** More resilient to anti-scraping measures than simple HTTP request libraries.

## 3. Data Flow & Interactions

1.  **User defines Scraper:** Frontend sends `POST /api/v1/scrapers` request to Backend.
2.  **Backend validates & stores:** Backend validates scraper definition, stores it in PostgreSQL, and returns success.
3.  **User triggers Scrape:** Frontend sends `POST /api/v1/scrapers/{id}/run` request to Backend.
4.  **Backend creates Job & enqueues:** Backend creates a `ScrapingJob` entry in PostgreSQL (status: `pending`), then sends an asynchronous task (`scrape_task`) to the Celery broker (Redis).
5.  **Celery Worker processes task:** A Celery worker picks up the `scrape_task` from Redis.
6.  **Worker runs Playwright:** The worker launches a Playwright browser instance, navigates to the target URL, applies the defined parsing rules, handles pagination, and extracts data.
7.  **Worker updates Job & stores Data:** During/after scraping, the worker updates the `ScrapingJob` status (e.g., to `running`, `completed`, or `failed`) and stores `ScrapedItem` records in PostgreSQL.
8.  **Frontend monitors:** Frontend periodically polls `GET /api/v1/jobs` or `GET /api/v1/data` endpoints to update the UI with job status and scraped results.

## 4. Scalability Considerations

*   **Horizontal Scaling (Backend):** Multiple FastAPI instances can be run behind a load balancer.
*   **Horizontal Scaling (Workers):** Multiple Celery worker containers can be added to increase concurrent scraping capacity.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding for very large datasets).
*   **Redis:** Can be scaled using clustering for high availability and throughput.
*   **Playwright:** Each Playwright instance within a worker consumes resources (CPU, RAM). The `MAX_CONCURRENT_SCRAPER_RUNS` setting limits this.

## 5. Security Considerations

*   **Authentication:** JWT ensures secure API access.
*   **Authorization:** Role-based access control (superuser vs. normal user) implemented at the API level.
*   **Environment Variables:** Sensitive configurations (e.g., `SECRET_KEY`, database credentials) are managed via environment variables and not hardcoded.
*   **Input Validation:** Pydantic schemas enforce strict validation of incoming request data.
*   **CORS:** Configured to allow communication between frontend and backend.
*   **Rate Limiting:** Prevents denial-of-service attacks or excessive resource consumption on API endpoints.

## 6. Future Enhancements

*   **Scheduling:** Implement CRON-like scheduling for recurring scraper runs.
*   **Proxies:** Integrate proxy rotation for scraping to avoid IP bans.
*   **Captcha Solving:** Integration with captcha solving services.
*   **Data Export:** Options to export scraped data (CSV, JSON).
*   **Webhooks:** Notify external systems upon job completion.
*   **Advanced Scraper Logic:** More complex parsing rules, conditional logic, login flows.
*   **Container Orchestration:** Deploy on Kubernetes for advanced production management.
*   **Observability:** Implement more detailed metrics (Prometheus/Grafana) and distributed tracing.