```markdown
# Architecture Documentation

## Overview

The ML Utilities System is a full-stack web application designed with a decoupled architecture, separating the frontend user interface from the backend API and data processing logic. It utilizes containerization for easy deployment and scalability.

## High-Level Architecture Diagram

```
+------------------+     +------------------+     +------------------+
|      User        |<--->|    Frontend      |<--->|    Backend       |
|    (Browser)     |     |    (React.js)    |     |    (FastAPI)     |
+------------------+     +--------^---------+     +--------^---------+
                                  |                      |
                                  | REST API             | ORM (SQLAlchemy)
                                  |                      |
                            +-----v-----+          +-----v------+
                            |   Redis   |<---------| PostgreSQL |
                            | (Caching) |          | (Database) |
                            +-----------+          +------------+

                                      +------------------+
                                      |   ML Libraries   |
                                      | (Scikit-learn,   |
                                      |     Pandas)      |
                                      +------------------+
```

## Component Breakdown

### 1. Frontend (React.js)

*   **Technology:** React 18, React Router DOM, Tailwind CSS, Axios.
*   **Purpose:** Provides the Single Page Application (SPA) user interface. It is responsible for rendering views, handling user interactions, and making API calls to the backend.
*   **Key Features:**
    *   User authentication (Login, Register).
    *   Dashboard for an overview of resources.
    *   Dedicated pages for managing Datasets, Models, and Experiments.
    *   Interactive forms for uploading data and configuring model training.
    *   Data tables for displaying information.
*   **Communication:** Interacts with the Backend via RESTful API calls using Axios.
*   **State Management:** Primarily uses React's `useState` and `useContext` (e.g., `AuthContext`) for local and global state management.

### 2. Backend (FastAPI)

*   **Technology:** Python 3.9+, FastAPI, SQLAlchemy (ORM), Alembic (migrations), PostgreSQL (database), Redis (cache), scikit-learn/pandas (ML libraries), python-jose/passlib (authentication).
*   **Purpose:** Serves as the API gateway and contains all core business logic, ML processing, and data persistence.
*   **Modules/Layers:**
    *   **`app.main`:** FastAPI application entry point, sets up middleware and routes.
    *   **`app.api.endpoints`:** Defines API routes (`/auth`, `/users`, `/datasets`, `/models`, `/experiments`) with input validation (Pydantic).
    *   **`app.auth`:** Handles user authentication (JWT token generation/verification) and authorization (dependency injection for roles).
    *   **`app.core`:** Centralized configuration, custom exceptions, and logging setup.
    *   **`app.crud`:** CRUD (Create, Read, Update, Delete) operations layer. Abstracts direct database interactions from business logic.
    *   **`app.db`:** Manages database sessions, SQLAlchemy models, and Alembic integration.
    *   **`app.middleware`:** Custom middleware for centralized error handling and API rate limiting.
    *   **`app.models`:** SQLAlchemy ORM models defining the database schema.
    *   **`app.schemas`:** Pydantic models for request/response validation and serialization.
    *   **`app.services`:** Contains the core business logic, especially for ML-related tasks (e.g., `dataset_service.py` for dataset processing, `ml_service.py` for model training, `prediction_service.py` for inference). This layer orchestrates CRUD operations and external utilities.
    *   **`app.utils`:** Utility functions like file storage management (`storage.py`) and Redis caching (`cache.py`).
*   **Deployment:** Designed to be served by an ASGI server like Uvicorn, typically behind a production-grade WSGI server like Gunicorn (configured via `gunicorn_conf.py` and `entrypoint.sh` in Docker).

### 3. Database (PostgreSQL)

*   **Technology:** PostgreSQL 15.
*   **Purpose:** Relational database for persistent storage of application data, including:
    *   `users`: User credentials and roles.
    *   `datasets`: Metadata about uploaded datasets (name, path, column info).
    *   `models`: Metadata about trained models (type, features, artifact path).
    *   `experiments`: Details of model training runs (hyperparameters, metrics).
*   **Management:** SQLAlchemy for ORM interactions, Alembic for schema migrations.

### 4. Caching (Redis)

*   **Technology:** Redis 7.
*   **Purpose:** In-memory data store used for:
    *   **Rate Limiting:** `fastapi-limiter` uses Redis to track request rates.
    *   **Model Artifact Caching:** `prediction_service` caches frequently accessed model files in Redis to reduce disk I/O and deserialization overhead.
    *   Future enhancements could include caching frequently accessed dataset metadata or aggregated dashboard statistics.

### 5. File Storage

*   **Implementation:** Local file system storage (`/app/data/storage` mounted as a Docker volume).
*   **Purpose:** Stores actual uploaded dataset files (CSVs) and serialized trained ML model artifacts (joblib files).
*   **Scalability Note:** For production deployments, this would typically be replaced by cloud object storage services like Amazon S3, Azure Blob Storage, or Google Cloud Storage. The `storage.py` utility provides an abstraction layer that makes switching storage backends easier.

### 6. Containerization (Docker & Docker Compose)

*   **Docker:** Used to containerize the Backend, Frontend, PostgreSQL, and Redis services, ensuring consistent environments across development, testing, and production.
*   **Docker Compose:** Orchestrates the multi-container application, defining service dependencies, networks, and volumes. Simplifies local setup and deployment.

### 7. CI/CD (GitHub Actions)

*   **Technology:** GitHub Actions.
*   **Purpose:** Automates the testing and deployment pipeline:
    *   **Continuous Integration (CI):** Runs linters (Flake8, ESLint) and unit/integration tests for both backend and frontend on every push and pull request. Reports code coverage.
    *   **Continuous Deployment (CD):** (Placeholder configuration) Triggers Docker image builds and pushes to a container registry, followed by deployment to a target environment (e.g., a server or cloud platform) upon merging to the `main` branch.

## Data Flow

1.  **User Interaction:** A user interacts with the React frontend.
2.  **API Requests:** The frontend sends authenticated HTTP requests to the FastAPI backend.
3.  **Backend Processing:**
    *   **Authentication/Authorization:** JWT tokens are validated; user permissions are checked.
    *   **Validation:** Pydantic schemas validate incoming request data.
    *   **Business Logic:** `services` layer executes operations, potentially involving:
        *   Reading/writing data via `crud` layer to `PostgreSQL`.
        *   Saving/loading files from local `storage`.
        *   Performing ML computations using `scikit-learn` and `pandas`.
        *   Interacting with `Redis` for caching or rate limiting.
    *   **Error Handling:** Middleware catches exceptions and returns standardized error responses.
4.  **Database/Storage Interactions:** The backend interacts with PostgreSQL for structured data and local file storage for large binaries (datasets, models).
5.  **Caching:** Redis is used to speed up operations by storing frequently accessed or computationally expensive results.