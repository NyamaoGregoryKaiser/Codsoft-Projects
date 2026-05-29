# MobileShop Backend System

This project provides a comprehensive, production-ready backend system for an e-commerce mobile application. It's built with Python using the Django web framework and Django REST Framework for RESTful APIs.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Setup (Virtual Environment)](#manual-setup-virtual-environment)
4.  [Running the Application](#running-the-application)
5.  [Database Management](#database-management)
6.  [Testing](#testing)
    *   [Unit and Integration Tests](#unit-and-integration-tests)
    *   [Performance Tests (Locust)](#performance-tests-locust)
7.  [API Documentation](#api-documentation)
8.  [Deployment Guide](#deployment-guide)
9.  [Additional Features](#additional-features)
10. [Contributing](#contributing)
11. [License](#license)

## 1. Features

*   **User Management**: User registration, login (JWT-based), profile management, admin user management.
*   **Product Catalog**: Categories, products with details (description, price, stock, image), product filtering, search, and inventory management.
*   **Order Processing**: Create orders, manage order items, update order status (admin), calculate total amounts, and handle stock reduction/return.
*   **Authentication & Authorization**: JWT (JSON Web Token) authentication for API clients, session authentication for admin panel. Role-based access control (admin vs. regular user).
*   **Database Layer**: PostgreSQL database with defined schemas, migrations, and seed data. Optimized queries using `select_related`/`prefetch_related`.
*   **Configuration**: Environment variable management (`django-environ`), Docker for containerization.
*   **Testing**: Comprehensive unit, integration, and API tests with high coverage. Performance testing with Locust.
*   **Documentation**: Detailed README, automatically generated API documentation (Swagger/Redoc).
*   **Logging & Monitoring**: Configurable logging to console and files.
*   **Error Handling**: Custom DRF exception handler for standardized error responses.
*   **Caching**: Redis-backed caching for improved API response times (e.g., product lists).
*   **Rate Limiting**: DRF's built-in rate limiting for anonymous and authenticated users.
*   **Asynchronous Tasks**: Celery with Redis backend for background task processing (e.g., for future long-running operations like email notifications, image processing).

## 2. Architecture

The backend is built as a monolithic Django application, structured into multiple Django apps, each representing a distinct domain:

*   **`config`**: Main project settings, URL routing, WSGI configuration.
*   **`users`**: Handles user authentication, authorization, and profile management.
*   **`products`**: Manages product categories and individual product details, including inventory.
*   **`orders`**: Manages customer orders and their associated items.
*   **`core`**: Contains reusable components like custom permissions, pagination, and the global exception handler.

**Key Technologies**:

*   **Python 3.11+**: Primary programming language.
*   **Django 4.2+**: Web framework for rapid development.
*   **Django REST Framework (DRF)**: For building powerful, flexible REST APIs.
*   **PostgreSQL**: Robust relational database.
*   **Redis**: In-memory data store for caching and as a Celery broker.
*   **Gunicorn**: WSGI HTTP Server for production deployment.
*   **Celery**: Distributed task queue for asynchronous processing.
*   **Docker & Docker Compose**: For containerization and easy environment setup.
*   **GitHub Actions**: CI/CD pipeline for automated testing and deployment.
*   **DRF-YASG**: For automatic OpenAPI/Swagger documentation.

## 3. Setup and Installation

### Prerequisites

Before you begin, ensure you have the following installed:

*   Git
*   Docker & Docker Compose (recommended for local development)
*   Python 3.11+ and pip (if setting up manually)

### Local Development with Docker Compose (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/mobile-shop-backend.git
    cd mobile-shop-backend
    ```

2.  **Create `.env` file**:
    Copy the example environment file and adjust values as needed.
    ```bash
    cp .env.example .env
    ```
    **Important**: For `SECRET_KEY`, generate a new strong key in `.env` for production deployments.

3.  **Build and run Docker containers**:
    This will set up the `web` app, `db` (PostgreSQL), `redis`, `celery_worker`, `celery_beat`, and `flower` services.
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs containers in detached mode.

4.  **Run migrations and collect static files**:
    The `entrypoint.sh` script automatically runs `manage.py migrate` and `manage.py collectstatic` when the `web` container starts.

5.  **Seed initial data (optional but recommended for development)**:
    This will create an admin user (`admin@example.com`/`adminpassword`) and some sample categories, products, and orders.
    ```bash
    docker-compose exec web python manage.py seed_data
    ```

### Manual Setup (Virtual Environment)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/mobile-shop-backend.git
    cd mobile-shop-backend
    ```

2.  **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create `.env` file**:
    Copy the example environment file and adjust values. Ensure `DATABASE_URL` points to a local PostgreSQL instance or SQLite (for quick start).
    ```bash
    cp .env.example .env
    # For SQLite (development only): DATABASE_URL=sqlite:///db.sqlite3
    # For PostgreSQL (local): DATABASE_URL=postgres://user:password@localhost:5432/mydatabase
    ```

5.  **Run migrations**:
    ```bash
    python manage.py migrate
    ```

6.  **Collect static files**:
    ```bash
    python manage.py collectstatic --noinput
    ```

7.  **Seed initial data (optional but recommended for development)**:
    ```bash
    python manage.py seed_data
    ```

## 4. Running the Application

*   **With Docker Compose**: The `web` service runs Gunicorn, listening on port 8000. You can access it via `http://localhost:8000`.
*   **Manually**:
    ```bash
    python manage.py runserver 0.0.0.0:8000
    ```
    This will run Django's development server. For production, you should use Gunicorn:
    ```bash
    gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    ```

**Celery Worker and Beat (if running manually)**:
If you need asynchronous tasks, you'll also need to run a Celery worker and Celery beat. Ensure Redis is running (e.g., `redis-server`).
```bash
# In a separate terminal
celery -A config worker -l info --concurrency=2

# In another separate terminal for scheduled tasks
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```
You can monitor Celery tasks with Flower:
```bash
celery -A config flower --broker=redis://localhost:6379/0 --address=0.0.0.0 --port=5555
# Access Flower UI at http://localhost:5555
```

## 5. Database Management

*   **Migrations**:
    *   Create new migrations after model changes: `python manage.py makemigrations`
    *   Apply migrations: `python manage.py migrate`
*   **Admin Panel**: Access the Django Admin panel at `http://localhost:8000/admin/`. Use the superuser credentials created by `seed_data` (admin@example.com / adminpassword) to log in.
*   **Seed Data**: The `python manage.py seed_data` command populates the database with essential development data.

## 6. Testing

### Unit and Integration Tests

The project includes comprehensive tests for models, serializers, views, and API endpoints.

To run tests with coverage:

**With Docker Compose**:
```bash
docker-compose exec web coverage run --source='.' manage.py test --settings=config.settings
docker-compose exec web coverage report
# Optional: Generate HTML report
docker-compose exec web coverage html
```

**Manually**:
```bash
coverage run --source='.' manage.py test --settings=config.settings
coverage report
# Optional: Generate HTML report (view in htmlcov/index.html)
coverage html
```

Aim for 80%+ test coverage. The CI/CD pipeline is configured to fail if coverage falls below this threshold.

### Performance Tests (Locust)

Locust is used for load testing API endpoints.

1.  **Ensure the backend is running** (e.g., `docker-compose up -d`).
2.  **Ensure seed data is present** (specifically `user1@example.com` and products with IDs 1 and 2).
3.  **Navigate to the performance test directory**:
    ```bash
    cd tests/performance
    ```
4.  **Run Locust**:
    ```bash
    locust -f load_test.py
    ```
5.  **Access the Locust web UI**: Open your browser to `http://localhost:8089`. Enter the desired number of users and spawn rate, then start the swarm.

The `load_test.py` script includes tasks for browsing products, viewing product details, creating orders, and viewing user profiles. It performs a login to obtain a JWT token for authenticated requests.

## 7. API Documentation

The API documentation is automatically generated using `drf-yasg` (Swagger/OpenAPI).

*   **Swagger UI**: `http://localhost:8000/swagger/`
*   **ReDoc**: `http://localhost:8000/redoc/`

These interfaces allow you to explore the available endpoints, their request/response schemas, and even test them directly from the browser (after authenticating via the JWT login endpoint).

**Authentication in API Docs**:
To test authenticated endpoints in Swagger UI, use the "Authorize" button and provide a JWT token (e.g., `Bearer <YOUR_ACCESS_TOKEN>`). You can obtain a token from the `/api/token/` endpoint.

## 8. Deployment Guide

This project is containerized using Docker, making it suitable for various deployment environments.

1.  **Build Docker Image**:
    ```bash
    docker build -t mobileshop-backend:latest .
    ```
2.  **Environment Variables**: Ensure all necessary environment variables are set in your deployment environment (e.g., Kubernetes secrets, environment variables in cloud services). **Crucially, generate a strong `SECRET_KEY` and set `DEBUG=False` for production.** Update `ALLOWED_HOSTS` to include your production domain(s).
3.  **Database**: Provision a managed PostgreSQL database instance (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL). Update `DATABASE_URL` accordingly.
4.  **Redis**: Provision a managed Redis instance (e.g., AWS ElastiCache, Azure Cache for Redis, Google Cloud Memorystore for Redis). Update `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.
5.  **Static/Media Files**: For production, configure a robust solution for serving static and media files:
    *   **Static Files**: Use a CDN (Content Delivery Network) or a dedicated web server (Nginx) to serve `staticfiles`.
    *   **Media Files**: Use cloud object storage (e.g., AWS S3, Azure Blob Storage, Google Cloud Storage) and configure Django to upload media files there.
6.  **Container Orchestration**: Deploy the Docker image to a container orchestration platform like Kubernetes, AWS ECS, Azure Container Apps, or Google Cloud Run/GKE.
    *   Ensure multiple instances of the `web` service are running behind a load balancer.
    *   Deploy `celery_worker` and `celery_beat` services separately.
7.  **CI/CD**: The `.github/workflows/ci.yml` provides a basic CI pipeline. For continuous deployment (CD), you would extend this to push Docker images to a container registry and trigger deployments to your chosen platform.
8.  **Monitoring & Logging**:
    *   Integrate with external logging services (e.g., ELK Stack, Splunk, Datadog) to centralize application logs.
    *   Use monitoring tools (e.g., Prometheus/Grafana, Datadog, New Relic) to track application performance, database metrics, and server health.

## 9. Additional Features

*   **Authentication/Authorization**: Leverages `djangorestframework-simplejwt` for secure token-based authentication and Django's built-in permissions and DRF's `IsAuthenticated`, `IsAdminUser`, and custom `IsOwnerOrReadOnly` classes.
*   **Logging**: Configured in `config/settings.py` to log messages to console and rotating files (`logs/app.log`, `logs/requests.log`).
*   **Error Handling Middleware**: A custom DRF exception handler (`core/exceptions.py`) provides consistent, standardized error responses for API clients and logs exceptions.
*   **Caching Layer**: Integrated with `django-redis` for Redis-backed caching. `@cache_page` decorator examples are shown for API views (e.g., `CategoryViewSet`, `ProductViewSet`) to cache entire responses, significantly reducing database load for frequently accessed data.
*   **Rate Limiting**: Configured in `config/settings.py` using DRF's `DEFAULT_THROTTLE_CLASSES` and `DEFAULT_THROTTLE_RATES` to prevent abuse for both anonymous and authenticated users. Custom throttles are defined for login and registration endpoints.
*   **Asynchronous Tasks (Celery)**: Integrated with Celery for background processing. While no specific tasks are implemented in this initial version, the setup is ready for tasks like sending email notifications, processing images, or handling complex order fulfillments in the background.
    *   The `config/celery.py` file is implicitly used by `config/__init__.py`.

## 10. Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass: `docker-compose exec web python manage.py test`
6.  Ensure code style is consistent using Black and Flake8:
    *   `black .`
    *   `flake8 .`
7.  Commit your changes: `git commit -m 'feat: Add new feature'`
8.  Push to your fork: `git push origin feature/your-feature-name`
9.  Open a Pull Request to the `develop` branch of the original repository.

## 11. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
--- END FILE ---

---