# ML Utilities System (C++ Backend + React Frontend)

This project provides a comprehensive, production-ready Machine Learning Utilities system. It features a high-performance C++ backend for core logic and API services, paired with a modern React.js frontend for an intuitive user experience. The system is designed for enterprise-grade applications, focusing on robust architecture, testability, and deployability.

## Architecture

The system is built with a decoupled frontend and backend architecture:

*   **Backend (C++)**: Developed using the `Crow` microframework, `sqlite_modern_cpp` for database interaction, `jwt-cpp` for authentication, `spdlog` for logging, and custom C++ implementations for ML utilities. It exposes a RESTful API.
*   **Frontend (React.js with TypeScript)**: A single-page application built with React, TypeScript, and `Chakra UI` for a responsive and accessible user interface. It communicates with the C++ backend via `axios`.
*   **Database**: `SQLite3` is used for simplicity and embeddability in this example. For larger deployments, it can be easily swapped for PostgreSQL or MySQL.
*   **Containerization**: `Docker` and `Docker Compose` are used to package and orchestrate the backend and frontend services.
*   **API Gateway/Reverse Proxy**: `Nginx` is used in the frontend Docker container to serve static files and proxy API requests to the backend service.

## Features

**Core Application (C++ Backend)**:
*   **User Management**: Register, login, and retrieve user profiles.
*   **Authentication & Authorization**: JWT-based authentication for secure API access.
*   **Model Management**: CRUD operations for ML model metadata (e.g., name, description, version, status, associated files).
*   **ML Data Transformations**: API endpoints to apply common preprocessing techniques like StandardScaler and MinMaxScaler to input data.
*   **Mock Prediction Service**: An endpoint to simulate model inference using registered models.
*   **Error Handling**: Centralized exception handling and standardized error responses.
*   **Logging**: Structured logging using `spdlog`.
*   **Middleware**: Custom middleware for Logging, Authentication, Caching, and Rate Limiting.

**Frontend (React.js)**:
*   User-friendly interface for registration and login.
*   Dashboard overview.
*   Dedicated pages for listing, viewing details, uploading, and editing ML models.
*   Interactive page for applying data transformations.
*   Interface to test mock prediction endpoints.
*   Responsive UI/UX with `Chakra UI`.

**Database Layer**:
*   SQLite3 schema definitions for `users` and `models` tables.
*   Migration scripts for versioning database schema.
*   Seed data for initial setup.

**Configuration & Setup**:
*   `.env` files for environment-specific configurations.
*   `CMake` for C++ backend build management.
*   `package.json` for Node.js dependencies.
*   `Dockerfiles` for backend and frontend.
*   `docker-compose.yml` for easy local development and deployment.

**Testing & Quality**:
*   **Unit Tests**:
    *   C++ Backend: `Catch2` framework (80%+ coverage target for core logic).
    *   React Frontend: `React Testing Library` and `Jest`.
*   **Integration Tests**: API tests (can be run manually with `curl`/Postman or automated with a tool like Newman/Cypress against the running Docker setup).
*   **Performance Tests**: (Described, not fully implemented with code for brevity, but can be done with tools like `JMeter` or `k6`).

## Setup and Installation

### Prerequisites

*   Docker and Docker Compose
*   Git

### 1. Clone the repository

```bash
git clone --recurse-submodules https://github.com/your-username/ml-utilities-system.git
cd ml-utilities-system
```
**Important**: `--recurse-submodules` is crucial to fetch all C++ dependencies (Crow, Catch2, etc.). If you cloned without it, run `git submodule update --init --recursive` from the root directory.

### 2. Configure Environment Variables

Create `.env` files based on the examples:

*   **Backend**: `cp backend/.env.example backend/.env`
    *   Edit `backend/.env` with your desired `JWT_SECRET` (at least 32 characters long for security), `PORT`, `DATABASE_PATH`, etc.
*   **Frontend**: `cp frontend/.env.example frontend/.env`
    *   `REACT_APP_API_BASE_URL` is configured for local development by default (pointing to the backend service). For Docker deployment, Nginx will handle proxying automatically.

### 3. Build and Run with Docker Compose

From the root directory of the project:

```bash
docker-compose build
docker-compose up
```

This will:
1.  Build the C++ backend Docker image.
2.  Build the React frontend Docker image.
3.  Start both services, along with an Nginx proxy for the frontend.

### 4. Access the Application

*   **Frontend UI**: Open your browser to `http://localhost:3000`
*   **Backend API (direct access, not recommended for frontend calls)**: `http://localhost:8080`

You can register a new user via the UI (`http://localhost:3000/register`) and then log in.

### 5. Running Tests

#### Backend (C++) Tests:

```bash
docker-compose run backend bash -c "cd build && ctest --output-on-failure"
# Or if you built locally without Docker:
# cd backend
# cmake -B build
# cmake --build build
# ./build/ml_utilities_tests
```

#### Frontend (React) Tests:

```bash
docker-compose run frontend npm test -- --coverage --watchAll=false
# Or if you have Node.js installed locally:
# cd frontend
# npm install
# npm test -- --coverage --watchAll=false
```

## Deployment Guide

Refer to `DEPLOYMENT.md` for detailed deployment instructions.

## API Documentation

Refer to `API_DOCS.md` for detailed API endpoint documentation.

## Architecture Documentation

Refer to `ARCHITECTURE.md` for a deeper dive into the system's design.
```