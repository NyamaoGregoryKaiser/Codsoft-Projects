# Enterprise-Grade Content Management System (CMS)

This is a comprehensive, production-ready Content Management System (CMS) built with **Django (Python)** for the backend API, **PostgreSQL** for the database, and a basic **React** application for the frontend. It includes a full suite of features typically expected in an enterprise-grade application, focusing on scalability, maintainability, and security.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Architecture Overview](#architecture-overview)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
    *   [Docker Setup (Recommended)](#docker-setup-recommended)
5.  [Running the Application](#running-the-application)
    *   [With Docker Compose](#with-docker-compose)
    *   [Locally (Backend & Frontend Separately)](#locally-backend--frontend-separately)
6.  [API Endpoints](#api-endpoints)
7.  [Testing](#testing)
8.  [Deployment](#deployment)
9.  [Additional Features](#additional-features)
10. [Future Enhancements](#future-enhancements)
11. [Contributing](#contributing)
12. [License](#license)

## 1. Features

**Core CMS Functionality:**

*   **Content Management:** Create, read, update, delete (CRUD) operations for various content types (Pages, Blog Posts).
*   **Rich Text Editor:** Integrated CKEditor for rich content editing.
*   **Categories & Tags:** Organize content for better navigation and SEO.
*   **Media Management:** Upload, view, and manage images and files.
*   **Comments:** User comments on content with moderation capabilities.
*   **Content Revisions:** Automatic tracking of content changes for version control and rollback.

**Enterprise-Grade Features:**

*   **Authentication & Authorization:** JWT-based authentication for APIs, with granular permissions (Admin, Author, Authenticated, Read-Only).
*   **User Management:** Secure user registration, login, and profile management.
*   **Logging & Monitoring:** Structured logging for application events and errors.
*   **Error Handling:** Centralized API error handling middleware for consistent responses.
*   **Caching Layer:** Redis-based caching for improved API response times.
*   **Rate Limiting:** Throttling for API endpoints to prevent abuse.
*   **Dockerization:** Containerized setup for easy deployment and consistency across environments.
*   **CI/CD Pipeline:** GitHub Actions workflow for automated testing and build processes.
*   **Comprehensive Testing:** Unit, integration, and API tests to ensure quality and reliability.
*   **API Documentation:** OpenAPI (Swagger UI) for interactive API exploration.

## 2. Technology Stack

**Backend:**

*   **Python 3.11+**
*   **Django 5.0+**: Web Framework
*   **Django REST Framework (DRF)**: For building powerful APIs
*   **djangorestframework-simplejwt**: JWT authentication
*   **PostgreSQL**: Relational Database
*   **Redis**: Caching and Celery broker (for async tasks, if extended)
*   **CKEditor**: Rich Text Editor integration
*   **django-environ**: 12-factor app configuration
*   **drf-spectacular**: OpenAPI 3 (Swagger) generation
*   **Gunicorn**: WSGI HTTP Server for production
*   **Whitenoise**: For serving static files in production
*   **Celery (basic setup)**: Distributed task queue (ready for async tasks)
*   **Pillow**: Image processing

**Frontend:**

*   **React 18+**
*   **Vite**: Fast frontend tooling
*   **Axios**: HTTP client for API requests
*   **React Router Dom**: Client-side routing

**DevOps/Tools:**

*   **Docker, Docker Compose**: Containerization
*   **GitHub Actions**: CI/CD
*   **pytest, pytest-django, pytest-cov**: Python testing frameworks

## 3. Architecture Overview

The CMS follows a typical **three-tier architecture**:

1.  **Presentation Layer (Frontend - React):**
    *   A single-page application (SPA) that consumes the backend API.
    *   Handles user interface, user experience, and client-side routing.
    *   Manages user sessions using JWT tokens stored securely (e.g., HTTP-only cookies or local storage with best practices).

2.  **Application Layer (Backend - Django/DRF):**
    *   Exposes a RESTful API for all CMS operations.
    *   Handles business logic, data validation, authentication, authorization, and integrates with the database and other services (like caching, logging).
    *   Uses Django models for ORM, DRF serializers and viewsets for API creation.
    *   Features like caching, rate limiting, and custom error handling are implemented at this layer.

3.  **Data Layer (PostgreSQL, Redis):**
    *   **PostgreSQL:** Stores all persistent application data (content, users, categories, tags, media metadata, comments, revisions).
    *   **Redis:** Used as a fast in-memory data store for caching API responses and as a message broker for potential asynchronous tasks (e.g., Celery).

**Communication Flow:**
Frontend <--- HTTP/HTTPS ---> Backend API <--- SQL / Redis Protocol ---> Database/Cache

**Security:**
*   JWT tokens for stateless authentication.
*   HTTPS enforcement (in production).
*   CORS headers for controlled cross-origin requests.
*   Rate limiting to prevent brute-force attacks and abuse.
*   Environment variables for sensitive configurations.
*   Input validation through DRF serializers.

## 4. Setup and Installation

### Prerequisites

*   **Python 3.11+**
*   **Node.js 20+** (and npm)
*   **Docker** and **Docker Compose** (recommended for easier setup)
*   **Git**

### Backend Setup (Local without Docker)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cms-project.git
    cd cms-project
    ```
2.  **Create and activate a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: `venv\Scripts\activate`
    ```
3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create a `.env` file:**
    Copy `.env.example` to `.env` and fill in your settings. For local development, you can use SQLite and keep `DEBUG=True`.
    ```bash
    cp .env.example .env
    ```
    *Make sure to change `DATABASE_URL` to `sqlite:///db.sqlite3` if you don't have PostgreSQL set up locally.*
    *If using PostgreSQL, ensure it's running and accessible.*
5.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```
6.  **Create a superuser (for admin access):**
    ```bash
    python manage.py createsuperuser
    ```
7.  **Seed initial data (optional, for development):**
    ```bash
    python manage.py seed_data --num_users 5 --num_content 20 --clear_old
    ```
8.  **Collect static files (required for admin CSS etc.):**
    ```bash
    python manage.py collectstatic --noinput
    ```

### Frontend Setup (Local without Docker)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file for the frontend:**
    Copy `frontend/.env.example` to `frontend/.env`. Ensure `REACT_APP_API_BASE_URL` points to your backend API.
    ```bash
    cp .env.example .env
    # Ensure REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
    ```

### Docker Setup (Recommended)

This is the easiest way to get the entire stack (backend, database, redis, frontend) running.

1.  **Ensure Docker and Docker Compose are installed.**
2.  **Create a `.env` file in the project root:**
    Copy `.env.example` to `.env`. Docker Compose will use these variables.
    ```bash
    cp .env.example .env
    ```
    *Ensure `DATABASE_URL` is configured for PostgreSQL (`postgres://user:password@db:5432/cms_db`) as `docker-compose.yml` expects it.*
3.  **Build and run the services:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    *   Build the `app` (Django) and `frontend` (React) images.
    *   Start `db` (PostgreSQL), `redis`, `app`, and `frontend` containers.
    *   Run Django migrations automatically on `app` startup (defined in `docker-compose.yml`).
    *   The Django app will be accessible at `http://localhost:8000`.
    *   The React frontend will be accessible at `http://localhost:3000`.

## 5. Running the Application

### With Docker Compose

Once `docker-compose up --build` completes:

*   **Backend API:** `http://localhost:8000/api/v1/`
*   **API Documentation (Swagger UI):** `http://localhost:8000/api/v1/schema/swagger-ui/`
*   **Django Admin:** `http://localhost:8000/admin/`
*   **Frontend Application:** `http://localhost:3000`

To stop the services:
```bash
docker-compose down
```

### Locally (Backend & Frontend Separately)

**1. Run the Backend:**
Navigate to the project root (`cms_project/`)
```bash
source venv/bin/activate # if using venv
python manage.py runserver
```
The backend will run on `http://127.0.0.1:8000`.

**2. Run the Frontend:**
Navigate to the `frontend/` directory
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`.

## 6. API Endpoints

All API endpoints are prefixed with `/api/v1/`.
The full interactive API documentation is available via **Swagger UI** at: `http://localhost:8000/api/v1/schema/swagger-ui/`

**Key Endpoints:**

*   **Authentication:**
    *   `POST /api/v1/auth/login/`: Obtain JWT access and refresh tokens.
    *   `POST /api/v1/auth/token/refresh/`: Refresh an expired access token.
    *   `POST /api/v1/register/`: Register a new user.
*   **Users:**
    *   `GET /api/v1/users/`: List all users (Admin only).
    *   `GET /api/v1/users/{id}/`: Retrieve user details (Admin or self).
    *   `PATCH /api/v1/users/{id}/`: Update user details (Admin or self).
    *   `GET /api/v1/users/me/`: Retrieve current authenticated user's profile.
*   **Content (Posts/Pages):**
    *   `GET /api/v1/content/`: List all published content (public), or all content including drafts for author/admin.
    *   `POST /api/v1/content/`: Create new content (Authenticated users).
    *   `GET /api/v1/content/{slug}/`: Retrieve specific content by slug (published content public, drafts for author/admin).
    *   `PUT /api/v1/content/{slug}/`: Update content (Author or Admin).
    *   `PATCH /api/v1/content/{slug}/`: Partially update content (Author or Admin).
    *   `DELETE /api/v1/content/{slug}/`: Delete content (Admin only).
    *   `GET /api/v1/content/{slug}/revisions/`: List content revisions (Admin only).
*   **Categories:**
    *   `GET /api/v1/categories/`: List all categories.
    *   `POST /api/v1/categories/`: Create category (Admin only).
    *   `GET /api/v1/categories/{slug}/`: Retrieve category.
    *   `PUT /api/v1/categories/{slug}/`, `PATCH /api/v1/categories/{slug}/`: Update category (Admin only).
    *   `DELETE /api/v1/categories/{slug}/`: Delete category (Admin only).
*   **Tags:**
    *   `GET /api/v1/tags/`: List all tags.
    *   `POST /api/v1/tags/`: Create tag (Admin only).
    *   `GET /api/v1/tags/{slug}/`: Retrieve tag.
    *   `PUT /api/v1/tags/{slug}/`, `PATCH /api/v1/tags/{slug}/`: Update tag (Admin only).
    *   `DELETE /api/v1/tags/{slug}/`: Delete tag (Admin only).
*   **Media:**
    *   `GET /api/v1/media/`: List media files (Authenticated users only, filtered by `uploaded_by` for non-admins).
    *   `POST /api/v1/media/`: Upload media file (Authenticated users).
    *   `GET /api/v1/media/{id}/`: Retrieve media file details.
    *   `PUT /api/v1/media/{id}/`, `PATCH /api/v1/media/{id}/`: Update media file (Owner or Admin).
    *   `DELETE /api/v1/media/{id}/`: Delete media file (Owner or Admin).
*   **Comments:**
    *   `GET /api/v1/content/{content_slug}/comments/`: List approved comments for a content item.
    *   `POST /api/v1/content/{content_slug}/comments/`: Create a comment (public, will be moderated if anonymous).
    *   `GET /api/v1/content/{content_slug}/comments/{id}/`: Retrieve a specific comment.
    *   `PUT /api/v1/content/{content_slug}/comments/{id}/`, `PATCH /api/v1/content/{content_slug}/comments/{id}/`: Update comment (Author or Admin).
    *   `DELETE /api/v1/content/{content_slug}/comments/{id}/`: Delete comment (Author or Admin).
    *   `POST /api/v1/content/{content_slug}/comments/{id}/approve/`: Approve a comment (Admin only).
    *   `POST /api/v1/content/{content_slug}/comments/{id}/disapprove/`: Disapprove a comment (Admin only).

## 7. Testing

The project includes comprehensive tests:

*   **Unit Tests:** For individual models, serializers, and utility functions.
*   **Integration Tests:** For API views, ensuring correct interaction with the database and other components.
*   **API Tests:** Using DRF's `APIClient` to simulate HTTP requests and verify API responses, authentication, and permissions.

To run tests:

```bash
# From the project root (cms_project/)
python manage.py test core
# Or using pytest (recommended)
pytest
# To generate coverage report
pytest --cov=core --cov-report=html
```
Open `htmlcov/index.html` to view the coverage report.

## 8. Deployment

This project is containerized with Docker, making deployment relatively straightforward to any cloud provider that supports Docker containers (e.g., AWS ECS/EKS, Google Cloud Run/GKE, Azure AKS, Heroku, DigitalOcean App Platform).

**General Production Deployment Steps:**

1.  **Environment Variables:** Ensure all sensitive configurations are set as environment variables in your deployment environment (e.g., `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `SECURE_SSL_REDIRECT=True` etc.). Use `config/settings/prod.py`.
2.  **Database:** Provision a managed PostgreSQL instance.
3.  **Redis:** Provision a managed Redis instance.
4.  **Static/Media Files:**
    *   For static files, Whitenoise is configured to serve them directly from Django in `prod.py`. For high traffic, consider a CDN (Content Delivery Network) like AWS S3 + CloudFront or Google Cloud Storage.
    *   For media files (user uploads), **DO NOT** store them directly on the application server's local filesystem in production. Use a cloud storage solution (e.g., AWS S3, Google Cloud Storage) and configure Django to use it (e.g., with `django-storages`).
5.  **Build Docker Image:**
    ```bash
    docker build -t your-repo/cms-app:latest .
    docker push your-repo/cms-app:latest
    ```
6.  **Orchestration/Hosting:**
    *   Deploy the `your-repo/cms-app:latest` Docker image to your chosen container orchestration platform (e.g., AWS ECS, Kubernetes).
    *   Configure service and ingress to expose port 8000.
7.  **Web Server (Optional but Recommended):** For maximum performance and security, place a web server like Nginx in front of Gunicorn to handle SSL termination, serve static files, and proxy requests to the Django app.
8.  **Run Migrations:** Ensure migrations are applied on deployment: `python manage.py migrate`. This is often done as part of the container's entrypoint or a pre-deployment hook.
9.  **Scale:** Configure horizontal scaling based on traffic load.

## 9. Additional Features

*   **Authentication/Authorization:** Implemented using JWT and custom DRF permissions (`IsAdminOrReadOnly`, `IsAuthorOrAdminOrReadOnly`, `IsOwnerOrAdmin`, `IsCommentAuthorOrAdminOrReadOnly`).
*   **Logging & Monitoring:** Standard Django logging configured to log to console and files, with different levels for development and production. Can be integrated with external services (e.g., Sentry, ELK stack).
*   **Error Handling Middleware:** Custom DRF exception handler (`core.utils.custom_exception_handler`) provides consistent, detailed error responses for API consumers.
*   **Caching Layer:** Redis integration via `django-redis` for caching API responses (e.g., `ContentViewSet` detail view). Configurable cache timeout.
*   **Rate Limiting:** DRF's throttling (`AnonRateThrottle`, `UserRateThrottle`, custom `LoginThrottle`) applied to relevant API endpoints to prevent abuse and brute-force attacks.
*   **Content Revision History:** `ContentRevision` model and `pre_save` signal track changes to content, offering version control capabilities.

## 10. Future Enhancements

*   **Asynchronous Tasks:** Fully integrate Celery for background tasks (e.g., image processing, email notifications, sitemap generation, content syndication).
*   **Advanced Search:** Integrate with a dedicated search engine like Elasticsearch or Algolia for powerful content search capabilities.
*   **SEO Tools:** Add sitemap generation, robots.txt management, and structured data (Schema.org) integration.
*   **Internationalization (i18n):** Support for multiple languages.
*   **User Roles & Permissions:** More granular role-based access control.
*   **Webhooks:** Trigger external services on content changes (e.g., publish event).
*   **Frontend UI/UX:** Develop a more sophisticated React frontend with rich editing capabilities, media library, drag-and-drop, etc.
*   **Theme/Template System:** Allow dynamic theme switching for frontend.
*   **Two-Factor Authentication (2FA):** Enhance security for user accounts.
*   **Security Audits:** Regular security scanning and penetration testing.

## 11. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`pytest`).
6.  Ensure code style is consistent (`flake8`).
7.  Commit your changes (`git commit -m 'feat: Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature`).
9.  Open a Pull Request.

## 12. License

This project is open source and available under the [MIT License](LICENSE).

---
*(This README.md file would typically be `cms_project/README.md`)*