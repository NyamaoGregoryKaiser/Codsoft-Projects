# Architecture Documentation

This document outlines the high-level architecture, design patterns, and module interactions of the Web Scraping Tools System.

## 1. High-Level Overview

The system follows a microservices-inspired architecture, primarily composed of a **FastAPI backend**, a **React frontend**, a **PostgreSQL database**, **Redis** for caching/queuing, and a **Celery worker** for background tasks, all orchestrated by **Docker Compose**.

```mermaid
graph TD
    User[User] -- "Interacts with" --> Frontend[React Frontend (Port 3000)]
    Frontend -- "API Calls (HTTP)" --> Nginx[Nginx / API Gateway (Optional in Prod)]
    Nginx -- "Proxy" --> Backend[FastAPI Backend (Port 8000)]

    Backend -- "Queues Tasks" --> RedisBroker[Redis (Broker for Celery)]
    Backend -- "Stores Data" --> PostgreSQL[PostgreSQL Database]
    Backend -- "Caches Data" --> RedisCache[Redis (Cache for API/Rate Limiting)]

    CeleryWorker[Celery Worker] -- "Pulls Tasks" --> RedisBroker
    CeleryWorker -- "Stores Results" --> RedisResults[Redis (Result Backend for Celery)]
    CeleryWorker -- "Accesses DB" --> PostgreSQL

    subgraph Infrastructure
        PostgreSQL
        RedisBroker
        RedisCache
        RedisResults
        CeleryWorker
    end
```

## 2. Core Components

### 2.1. Backend (FastAPI - Python)

The backend is built with FastAPI, a modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.

*   **`main.py`**: The entry point of the FastAPI application. It initializes the app, includes routers, sets up middlewares (logging, error handling, rate limiting), and configures event handlers (startup/shutdown).
*   **`api/v1/*.py`**: Defines the RESTful API endpoints for different resources (auth, users, scrapers, jobs, results). Uses FastAPI's `APIRouter` to organize endpoints.
*   **`schemas/*.py`**: Pydantic models used for request body validation, response serialization, and data transformation. This ensures data consistency and provides automatic OpenAPI documentation.
*   **`models/*.py`**: SQLAlchemy ORM models representing the database schema. Each Python class maps to a database table.
*   **`crud/*.py`**: Contains Create, Read, Update, Delete (CRUD) operations for each model. This layer abstracts database interactions from business logic, promoting reusability and testability.
*   **`services/*.py`**: Implements the core business logic.
    *   `auth_service.py`: Handles user registration, authentication, and token generation.
    *   `scraper_service.py`: Orchestrates the scraping process, including validation of rules, triggering Celery tasks, and processing results. This service interacts with the `crud` layer and the `celery` worker.
*   **`core/*.py`**: Contains foundational components:
    *   `config.py`: Manages application settings and environment variables (using `pydantic-settings`).
    *   `database.py`: Handles SQLAlchemy engine, session management, and base model definitions.
    *   `security.py`: Implements JWT token handling, password hashing (Bcrypt), and dependency injection for authentication.
    *   `exceptions.py`: Defines custom exceptions and their handlers for consistent error responses.
    *   `middlewares.py`: FastAPI middleware for logging requests/responses, general error handling, and applying rate limiting.
    *   `celery.py`: Initializes the Celery application instance.
*   **`worker/tasks.py`**: Defines asynchronous tasks that can be executed by the Celery worker. The primary task is `run_scraper_task`, which performs the actual web scraping using `httpx` and `BeautifulSoup4` (or `Playwright` for dynamic content).

### 2.2. Frontend (React)

The frontend is a single-page application (SPA) built with React and TypeScript, providing an interactive user interface.
*(Note: Full frontend code is conceptual, with key files demonstrating structure and API interaction.)*

*   **`src/index.tsx`**: Application entry point, renders the `App` component.
*   **`src/App.tsx`**: Main application component, sets up routing (`react-router-dom`) and provides global contexts (e.g., `AuthProvider`).
*   **`src/auth/AuthProvider.tsx`**: Manages user authentication state, token storage, login/logout logic, and provides auth context to other components.
*   **`src/api/index.ts`**: An Axios-based API client for interacting with the backend. Handles token attachment for authenticated requests.
*   **`src/pages/*.tsx`**: Contains page-level components (e.g., `Login`, `Scrapers`, `ScraperDetail`, `Jobs`). These components fetch data from the backend via the API client and render the UI.
*   **`src/components/*.tsx`**: Reusable UI components (e.g., `Layout`, `Nav`).
*   **Styling**: Utilizes Tailwind CSS for utility-first styling.

### 2.3. Database (PostgreSQL)

*   **Schema**:
    *   `users`: Stores user credentials and roles (`is_active`, `is_superuser`).
    *   `scrapers`: Defines the configuration for each web scraper (name, target URL, parsing rules as JSONB).
    *   `scraping_jobs`: Records each instance of a scraper being run (status, start/end times, logs).
    *   `scraped_data`: Stores the actual data extracted by a job (data as JSONB).
*   **ORM**: SQLAlchemy is used as the Object-Relational Mapper, abstracting direct SQL queries.
*   **Migrations**: Alembic handles database schema changes and version control, ensuring smooth upgrades.

### 2.4. Message Broker & Cache (Redis)

Redis is used for multiple purposes:
*   **Celery Broker**: Acts as the message broker for Celery, allowing the backend to queue tasks for the worker.
*   **Celery Result Backend**: Stores the results of Celery tasks.
*   **API Caching**: Used by `fastapi-cache` to cache API responses, reducing database load for frequently accessed endpoints.
*   **Rate Limiting**: Used by `fastapi-limiter` to track and enforce API rate limits, protecting against abuse.

### 2.5. Background Task Queue (Celery)

*   **Purpose**: Decouples the long-running web scraping operations from the main API process. When a user triggers a scrape, the API quickly enqueues a task with Celery, providing an immediate response to the user, while the actual scraping happens asynchronously in the background.
*   **Components**:
    *   **Celery App**: Configured within the backend.
    *   **Celery Worker**: A separate process that consumes tasks from the Redis broker and executes them.
    *   **Celery Beat (Optional, but planned for future)**: Can schedule recurring scraping jobs.

## 3. Data Flow

1.  **User Interaction**: A user logs in via the React frontend. The frontend sends credentials to the Backend's `/api/v1/auth/login` endpoint.
2.  **Authentication**: The Backend authenticates the user, generates a JWT token, and returns it to the frontend. The frontend stores this token (e.g., in local storage).
3.  **Scraper Definition**: The user creates a new scraper definition through the frontend. The frontend sends a `POST` request with scraper details to `/api/v1/scrapers`. The Backend validates the input (Pydantic schemas), creates a `Scraper` record in PostgreSQL via `crud`, and returns the created scraper.
4.  **Job Creation**: The user triggers a scraping job for a defined scraper. The frontend sends a `POST` request to `/api/v1/jobs`.
5.  **Task Enqueueing**: The Backend, specifically `scraper_service.py`, receives the job request. Instead of performing the scrape directly, it creates a `ScrapingJob` record in PostgreSQL (status: PENDING), and then dispatches an asynchronous task (e.g., `run_scraper_task`) to the Celery worker via Redis. It then returns the `ScrapingJob` details to the frontend.
6.  **Asynchronous Scraping**: The Celery worker picks up the `run_scraper_task` from Redis. It fetches the scraper's configuration from PostgreSQL, executes the scraping logic (using `httpx` and `BeautifulSoup4`/`Playwright`), processes the extracted data, and stores it as `ScrapedData` records in PostgreSQL. It also updates the `ScrapingJob` status (RUNNING, COMPLETED, FAILED) and logs.
7.  **Result Retrieval**: The frontend periodically polls or uses WebSockets (for real-time updates, not implemented in this version) to check the status of jobs. When a job is `COMPLETED`, the frontend can request the scraped data from `/api/v1/jobs/{job_id}/results` or `/api/v1/scraped_data`.
8.  **Data Display**: The Backend fetches `ScrapedData` from PostgreSQL and returns it to the frontend, which then displays it to the user.

## 4. Security Considerations

*   **Authentication**: JWT tokens for stateless API authentication.
*   **Authorization**: Role-based (superuser vs. regular user) to control access to sensitive endpoints.
*   **Password Hashing**: Bcrypt for storing user passwords securely.
*   **Environment Variables**: Sensitive configuration (e.g., `SECRET_KEY`, database credentials) are managed via environment variables and `pydantic-settings`.
*   **Input Validation**: Pydantic schemas are extensively used for request and response validation, preventing common injection attacks and ensuring data integrity.
*   **Rate Limiting**: Protects against brute-force attacks and API abuse.
*   **CORS**: Configured in FastAPI to allow frontend access.

## 5. Scalability and Performance

*   **Asynchronous Processing**: Celery offloads long-running scraping tasks, preventing the API from blocking.
*   **FastAPI**: Built on Starlette and Uvicorn, providing high performance for API endpoints.
*   **Redis Caching**: Reduces database load for frequently accessed or computationally expensive endpoints.
*   **Docker/Containerization**: Allows for easy horizontal scaling of backend and worker services independently.
*   **PostgreSQL**: A robust relational database capable of handling large datasets and high concurrency.
*   **Query Optimization**: SQLAlchemy allows for efficient queries, and database indexing is planned.

## 6. Error Handling and Logging

*   **Centralized Error Handling**: Custom exception classes and FastAPI's `exception_handler` middleware provide consistent error responses (JSON format) to the client.
*   **Structured Logging**: `structlog` (or Python's standard `logging` configured for JSON output) will be used to log requests, responses, errors, and application events, making it easier to monitor and debug in production. Logs will be directed to `stdout`/`stderr` for easy collection by container orchestration systems.

## 7. Future Enhancements

*   **Scheduled Scrapes**: Integrate Celery Beat for recurring jobs.
*   **Real-time Updates**: Implement WebSockets for real-time job status updates and results.
*   **Advanced Scraper Configuration**: Support for XPath, regex, more complex navigation (e.g., pagination clicks), proxy rotation, user-agent rotation.
*   **UI for Rule Definition**: A visual editor for defining scraping rules instead of raw JSON.
*   **Data Export**: Options to export scraped data in various formats (CSV, JSON, Excel).
*   **Monitoring Dashboards**: Integration with tools like Prometheus/Grafana for application and infrastructure metrics.

---