# CMS Project: Enterprise-Grade Content Management System

Welcome to the CMS Project, a full-stack, production-ready Content Management System built with Django REST Framework (Python) for the backend and React for the frontend. This system is designed for scalability, maintainability, and robust performance, featuring comprehensive authentication, media management, content organization, and a modular architecture.

## Table of Contents

1.  [Features](#features)
2.  [Architecture Overview](#architecture-overview)
3.  [Prerequisites](#prerequisites)
4.  [Getting Started](#getting-started)
    *   [1. Clone the Repository](#1-clone-the-repository)
    *   [2. Environment Variables](#2-environment-variables)
    *   [3. Docker Compose Setup](#3-docker-compose-setup)
    *   [4. Initialize Database and Seed Data](#4-initialize-database-and-seed-data)
    *   [5. Access the Application](#5-access-the-application)
5.  [Key API Endpoints](#key-api-endpoints)
6.  [Running Tests](#running-tests)
7.  [Project Structure](#project-structure)
8.  [Technology Stack](#technology-stack)
9.  [Contributing](#contributing)
10. [License](#license)

## Features

*   **User Management**: Registration, Login (JWT-based), User Profiles.
*   **Content Management**:
    *   **Posts**: Create, Read, Update, Delete (CRUD) blog posts with rich content.
    *   **Pages**: Manage static pages (e.g., "About Us", "Contact").
    *   **Categories & Tags**: Organize content efficiently.
*   **Media Management**: Upload, manage, and associate images/files with content.
*   **Authentication & Authorization**: Secure JWT-based authentication, granular permissions (owner, admin, read-only).
*   **API Endpoints**: Full CRUD operations exposed via RESTful APIs.
*   **Error Handling**: Centralized error handling middleware.
*   **Logging & Monitoring**: Structured logging across the backend.
*   **Caching Layer**: Redis-backed caching for improved performance on read operations.
*   **Rate Limiting**: Protect APIs from abuse.
*   **Dockerization**: Containerized development and deployment environment.
*   **CI/CD**: GitHub Actions workflow for automated testing and deployment.
*   **Comprehensive Documentation**: API docs (Swagger/OpenAPI), architecture, deployment guides.

## Architecture Overview

Refer to `ARCHITECTURE.md` for a detailed overview of the system architecture.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Git**: For cloning the repository.
*   **Docker & Docker Compose**: For running the application services.
    *   [Install Docker Engine](https://docs.docker.com/engine/install/)
    *   [Install Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

Follow these steps to get the CMS project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cms-project.git # Replace with your repo URL
cd cms-project
```

### 2. Environment Variables

Create `.env` files for both backend and frontend by copying the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Edit `backend/.env`**:
Open `backend/.env` and replace placeholders.
*   `SECRET_KEY`: Generate a strong, random string (e.g., using `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`).
*   `DATABASE_URL`: Defaults to `postgres://user:password@db:5432/cms_db`. You can customize `user`, `password`, `cms_db` if needed, but ensure they match your `docker-compose.yml` if changed.
*   `REDIS_URL`: Defaults to `redis://redis:6379/0`.
*   `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`: Add your frontend domain/IP if different from `localhost`.
*   `MEDIA_ROOT`, `STATIC_ROOT`: These paths are inside the Docker container, mapped to Docker volumes.

**Edit `frontend/.env`**:
Open `frontend/.env`.
*   `REACT_APP_API_BASE_URL`: In development with `docker-compose`, it usually points to the backend service directly or relies on the proxy. Set to `http://localhost:8000` for development and `/api` in production if Nginx is proxying.

### 3. Docker Compose Setup

Navigate to the root of the `cms_project` directory and build/run the services:

```bash
docker-compose build
docker-compose up -d
```

This will:
*   Build Docker images for the backend (Django) and frontend (React + Nginx).
*   Start PostgreSQL database, Redis cache, Django backend, and React frontend (served by Nginx).
*   Create Docker volumes for persistent data (database, media, static files).

### 4. Initialize Database and Seed Data

Once the services are up, run database migrations and then seed some initial data:

```bash
# Wait for DB to be healthy if services just started (check 'docker-compose ps')
docker-compose exec backend python manage.py makemigrations apps.core apps.users apps.content apps.media
docker-compose exec backend python manage.py migrate

# Create a superuser (admin/adminpassword) and some sample content
docker-compose exec backend python scripts/seed_data.py
```
This will create:
*   Superuser: `username: admin`, `password: adminpassword`
*   Regular user: `username: editor`, `password: editorpassword`
*   Sample categories, tags, posts (some published, some drafts), and pages.

### 5. Access the Application

*   **Frontend**: Open your browser to `http://localhost:3000`
*   **Backend API (Swagger UI)**: `http://localhost:8000/api/v1/docs/`
*   **Django Admin**: `http://localhost:8000/admin/` (Login with `admin/adminpassword`)

You can log in to the frontend with either `admin/adminpassword` or `editor/editorpassword`.

## Key API Endpoints

The API is fully documented using Swagger UI. Navigate to `http://localhost:8000/api/v1/docs/` after starting the backend.

Key endpoints include:

*   `/api/v1/auth/register/` (POST): Register new user
*   `/api/v1/auth/token/` (POST): Obtain JWT access and refresh tokens
*   `/api/v1/auth/token/refresh/` (POST): Refresh access token
*   `/api/v1/auth/me/` (GET, PATCH): Authenticated user's profile
*   `/api/v1/categories/` (CRUD): Manage content categories
*   `/api/v1/tags/` (CRUD): Manage content tags
*   `/api/v1/posts/` (CRUD): Manage blog posts
*   `/api/v1/pages/` (CRUD): Manage static pages
*   `/api/v1/media/` (CRUD): Upload and manage media files

## Running Tests

### Backend Tests

Run all Django tests:

```bash
docker-compose exec backend python manage.py test apps
```
To run tests with coverage:

```bash
docker-compose exec backend sh -c "pip install coverage && coverage run --source='.' manage.py test apps --noinput && coverage report -m"
```

### Frontend Tests

To run React unit tests:

```bash
docker-compose exec frontend npm test
```

## Project Structure

A detailed breakdown of the project directories and files is available in the `ARCHITECTURE.md` file.

## Technology Stack

*   **Backend**: Python, Django, Django REST Framework, PostgreSQL, Redis
*   **Frontend**: React.js, Axios, React Router
*   **Authentication**: JWT (JSON Web Tokens)
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions
*   **API Documentation**: DRF Spectacular (OpenAPI/Swagger)
*   **Logging**: Standard Python `logging` module
*   **Code Quality**: flake8 (Python), ESLint (JavaScript)

## Contributing

Contributions are welcome! Please refer to the `CONTRIBUTING.md` (if exists) for guidelines.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---
```