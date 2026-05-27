# ML Utilities System

A comprehensive, production-ready Machine Learning utilities system built as a full-stack web application.
The system features a high-performance C++ backend for business logic and ML operations, a modern React frontend for an intuitive user experience, and robust infrastructure for deployment, testing, and monitoring.

## Table of Contents

1.  [Project Overview](#1-project-overview)
2.  [Features](#2-features)
3.  [Architecture](#3-architecture)
4.  [Technology Stack](#4-technology-stack)
5.  [Setup & Installation](#5-setup--installation)
    *   [Prerequisites](#prerequisites)
    *   [Backend (C++) Setup](#backend-c-setup)
    *   [Frontend (React) Setup](#frontend-react-setup)
    *   [Database Setup](#database-setup)
    *   [Docker Setup](#docker-setup)
6.  [Running the Application](#6-running-the-application)
7.  [API Documentation](#7-api-documentation)
8.  [Testing](#8-testing)
9.  [Deployment](#9-deployment)
10. [CI/CD](#10-cicd)
11. [Contributing](#11-contributing)
12. [License](#12-license)

## 1. Project Overview

The ML Utilities System provides a platform for managing and interacting with Machine Learning models. It allows users to register models, upload data for inference, and view basic model metadata. The system is designed with scalability, security, and maintainability in mind, suitable for enterprise environments.

## 2. Features

*   **User Management:** Register, login, and manage user accounts with secure authentication.
*   **Model Registry:** Store and retrieve metadata for various ML models (name, version, path, type, creation date, associated user).
*   **ML Inference:** Upload data (e.g., CSV, JSON) and receive predictions from registered models.
*   **Data Preprocessing (Basic):** Utility for simple data transformations before inference.
*   **API Endpoints:** Full CRUD operations for users, models, and data points.
*   **Authentication & Authorization:** JWT-based secure access control.
*   **Logging:** Comprehensive logging for backend operations and errors.
*   **Error Handling:** Centralized error handling middleware for consistent API responses.
*   **Caching:** In-memory caching for frequently accessed model metadata.
*   **Rate Limiting:** Protect API endpoints from abuse.
*   **Web UI:** Responsive React application for easy interaction.

## 3. Architecture

The system follows a microservices-inspired architecture with a clear separation of concerns:

*   **Backend (C++):** A high-performance RESTful API service handling all business logic, ML operations, and database interactions. It's built with the Crow framework.
*   **Frontend (React):** A single-page application (SPA) providing the user interface, communicating with the backend via REST APIs.
*   **Database (PostgreSQL):** A relational database for persistent storage of user, model, and data metadata.

Refer to `docs/architecture.md` for a detailed architectural overview.

## 4. Technology Stack

### Backend (C++)
*   **Language:** C++20
*   **Web Framework:** [Crow](https://github.com/ipkn/crow)
*   **Database Driver:** [libpqxx](https://github.com/libpqxx/libpqxx)
*   **JSON Handling:** [nlohmann/json](https://github.com/nlohmann/json)
*   **JWT:** [jwt-cpp](https://github.com/Thalhammer/jwt-cpp)
*   **Logging:** [spdlog](https://github.com/gabime/spdlog)
*   **Build System:** CMake
*   **Package Manager:** [vcpkg](https://vcpkg.io/)
*   **Testing:** [Google Test](https://github.com/google/googletest)

### Frontend (React)
*   **Framework:** [React](https://reactjs.org/)
*   **Language:** JavaScript (ES6+)
*   **Routing:** [React Router DOM](https://reactrouter.com/)
*   **Styling:** CSS Modules, Custom CSS
*   **Build Tool:** Create React App (or Vite equivalent)
*   **Testing:** [Jest](https://jestjs.io/)

### Database
*   **Type:** Relational Database
*   **System:** [PostgreSQL](https://www.postgresql.org/)

### Infrastructure & Tools
*   **Containerization:** [Docker](https://www.docker.com/)
*   **Orchestration:** [Docker Compose](https://docs.docker.com/compose/)
*   **CI/CD:** [GitHub Actions](https://github.com/features/actions)
*   **API Documentation:** [OpenAPI (Swagger)](https://swagger.io/specification/)

## 5. Setup & Installation

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Git:** For cloning the repository.
*   **Docker & Docker Compose:** For containerized development and deployment.
*   **C++ Development Environment (if building natively):**
    *   C++20 compatible compiler (e.g., GCC 10+, Clang 11+, MSVC 2019+)
    *   CMake 3.15+
    *   [vcpkg](https://vcpkg.io/en/getting-started.html) (follow installation instructions for your OS)
*   **Node.js & npm (if building frontend natively):**
    *   Node.js 14+
    *   npm 6+ (or yarn)

### Backend (C++) Setup (Native - Optional, Docker recommended)

1.  **Navigate to the backend directory:**
    ```bash
    cd ml-utilities-system/backend-cpp
    ```
2.  **Install C++ Dependencies using vcpkg:**
    ```bash
    vcpkg install # This will install dependencies defined in vcpkg.json
    ```
    *   *Note:* Ensure vcpkg is integrated with CMake: `vcpkg integrate install`
3.  **Configure and Build with CMake:**
    ```bash
    mkdir build
    cd build
    cmake .. -DCMAKE_TOOLCHAIN_FILE=<path_to_vcpkg>/scripts/buildsystems/vcpkg.cmake
    cmake --build .
    ```
4.  **Environment Variables:** Create a `.env` file based on `.env.example` and fill in your PostgreSQL credentials and JWT secret.

### Frontend (React) Setup (Native - Optional, Docker recommended)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ml-utilities-system/frontend-react
    ```
2.  **Install Node.js Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env.development` file based on the example.
    ```
    REACT_APP_API_BASE_URL=http://localhost:8080/api
    ```

### Database Setup

The database will be managed by Docker Compose. However, if running natively, you'd need a PostgreSQL server.
For Docker setup:
1.  Ensure Docker and Docker Compose are running.
2.  The `docker-compose.yml` file will automatically set up a PostgreSQL container.
3.  Connect to the database and run the migration scripts located in `database/migrations/` in order.
    A simple way to do this after `docker-compose up -d` is to exec into the pg container:
    ```bash
    docker exec -it ml_db psql -U user -d ml_system_db
    \i /docker-entrypoint-initdb.d/schema.sql
    \i /docker-entrypoint-initdb.d/001_create_users_table.sql
    ... (repeat for other migrations)
    \i /docker-entrypoint-initdb.d/seed.sql
    ```
    *Note: The `docker-entrypoint-initdb.d` will automatically run `.sql` files, so manual execution might not be necessary if they are copied correctly.*

## 6. Running the Application

The easiest way to run the entire application is using Docker Compose.

1.  **Navigate to the project root:**
    ```bash
    cd ml-utilities-system
    ```
2.  **Create `.env` files:**
    *   Copy `backend-cpp/.env.example` to `backend-cpp/.env` and fill in values.
    *   Copy `frontend-react/.env.development.example` to `frontend-react/.env.development` and fill in values.
3.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the C++ backend Docker image.
    *   Build the React frontend Docker image.
    *   Start the PostgreSQL database container.
    *   Start the backend service (on port 8080).
    *   Start the frontend service (on port 3000, proxied by Nginx).

4.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:8080/api`

## 7. API Documentation

The backend API is documented using OpenAPI (Swagger).
You can find the specification in `docs/api.yaml`.
Once the backend is running, you can typically view an interactive Swagger UI if integrated (though not explicitly set up in this basic Crow backend, it's common practice). You can use tools like Swagger Editor to view the `api.yaml`.

## 8. Testing

### Backend (C++)
*   **Unit Tests:** Located in `backend-cpp/tests/unit`.
    *   Run from `backend-cpp/build` directory after building: `./tests/unit_tests`
*   **Integration Tests:** Located in `backend-cpp/tests/integration`.
    *   Run from `backend-cpp/build` directory after building: `./tests/integration_tests`
*   **API Tests:** Use `curl` or a tool like Postman/Insomnia with the `docs/api.yaml` specification.

### Frontend (React)
*   **Unit/Component Tests:** Located in `frontend-react/src/**/*.test.js`.
    *   Run: `cd frontend-react && npm test`

### Performance Tests
*   While not explicitly implemented as runnable scripts here, performance testing can be done using tools like JMeter or k6 against the `/api` endpoints.

## 9. Deployment

Refer to `docs/deployment.md` for a detailed guide on deploying the application to a production environment. This typically involves using a cloud provider (AWS, GCP, Azure), Kubernetes, or similar orchestration tools.

## 10. CI/CD

The project includes GitHub Actions workflows (`.github/workflows/ci-cd.yml`) for continuous integration and continuous deployment. This pipeline will:
*   Build and test the C++ backend.
*   Build and test the React frontend.
*   Build Docker images for both services.
*   Push images to a container registry (e.g., Docker Hub, GitHub Container Registry).
*   (Optional) Deploy to a staging or production environment.

## 11. Contributing

We welcome contributions! Please refer to our `CONTRIBUTING.md` (placeholder, not created in this response) for guidelines.

## 12. License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```