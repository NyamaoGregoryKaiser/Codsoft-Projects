# 📊 DataViz Pro: Enterprise-Grade Data Visualization System

DataViz Pro is a robust, scalable, and secure data visualization platform built for enterprise use. It allows users to upload their datasets, create interactive dashboards with various visualization types, and share insights effectively. The system features a high-performance C++ backend, a responsive React/TypeScript frontend, and a PostgreSQL database.

## ✨ Features

*   **User Management:** Secure registration, login, and profile management with JWT authentication.
*   **Dataset Management:**
    *   Upload various data formats (e.g., CSV, JSON).
    *   Automatic schema inference upon upload.
    *   CRUD operations for datasets (view, update metadata, delete).
    *   Retrieve sample data for preview.
*   **Dashboard Management:**
    *   Create, view, update, and delete interactive dashboards.
    *   Flexible layout configuration using JSONB.
    *   Integrate multiple visualizations linked to datasets.
*   **API:** Full RESTful API with CRUD operations for users, datasets, and dashboards.
*   **Security:** JWT-based authentication and authorization, secure password hashing (conceptually, bcrypt recommended).
*   **Performance:** C++ backend for efficient data processing and API response.
*   **Scalability:** Containerized (Docker) for easy deployment and scaling.
*   **Observability:** Structured logging with `spdlog`.
*   **Robustness:** Comprehensive error handling and rate limiting.
*   **Database:** PostgreSQL with schema migrations and indexing for optimal query performance.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Docker and Docker Compose installed.
*   `git` for cloning the repository.
*   `jq` (optional, for parsing JSON in some CI/CD steps/API tests).

### Installation (Docker Compose)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/dataviz-pro.git
    cd dataviz-pro
    ```

2.  **Create a `.env` file:**
    Copy the `.env.example` file and fill in your secrets.
    ```bash
    cp .env.example .env
    ```
    **Important:** Change `JWT_SECRET` to a strong, random string in your `.env` file.

3.  **Build and run the services:**
    This will build the Docker images for the backend and frontend, set up the PostgreSQL database, run initial schema migrations, and seed data.
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Rebuilds images (useful for fresh installs or code changes).
    *   `-d`: Runs containers in detached mode.

4.  **Verify Services:**
    *   **Backend API:** `http://localhost:8080/health` (should return `{"status": "UP"}`)
    *   **Frontend UI:** `http://localhost:3000`

    You can check container logs with `docker-compose logs -f`.

### Backend Development (C++)

If you want to develop the C++ backend outside Docker:

1.  **Prerequisites:**
    *   C++17/20 compiler (g++ recommended)
    *   CMake (version 3.10+)
    *   PostgreSQL development libraries (`libpqxx-dev` on Debian/Ubuntu)
    *   `libcrow-dev` (Crow web framework)
    *   `nlohmann/json` (for JSON parsing)
    *   `spdlog` (for logging)
    *   `libssl-dev` (for OpenSSL for JWT)
    *   `libboost-uuid-dev` (for UUID generation)

    On Ubuntu/Debian:
    ```bash
    sudo apt update
    sudo apt install build-essential cmake libpqxx-dev libspdlog-dev libssl-dev libboost-uuid-dev
    # For Crow and nlohmann/json, you might need to install them via vcpkg or build from source
    # This project assumes they are available via system packages or vcpkg.
    # Example for Crow (may vary based on distribution): sudo apt install libcrow-dev
    # For nlohmann/json, a simple header-only include might suffice, or vcpkg: vcpkg install nlohmann-json
    ```

2.  **Build:**
    ```bash
    cd server
    mkdir build
    cd build
    cmake ..
    make -j$(nproc)
    ```

3.  **Run:**
    Ensure your PostgreSQL database is running (e.g., via `docker-compose up -d db`) and your environment variables are set.
    ```bash
    export DATABASE_URL="postgresql://user:password@localhost:5432/datavizpro"
    export SERVER_PORT=8080
    export JWT_SECRET="your_very_secure_and_long_random_jwt_secret_key_change_me_now"
    ./dataviz_server
    ```

### Frontend Development (React)

If you want to develop the React frontend outside Docker:

1.  **Prerequisites:**
    *   Node.js (v18+) and npm/yarn

2.  **Install dependencies:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Run:**
    ```bash
    npm start
    ```
    The frontend will be available at `http://localhost:3000`. It will proxy API requests to the backend at `http://localhost:8080`.

## 🧪 Testing

### Backend Tests (C++ with GTest)

1.  **Run inside Docker (recommended for consistency):**
    ```bash
    docker-compose -f docker-compose.yml up -d db # Ensure DB is running
    docker-compose -f docker-compose.yml exec backend /bin/bash -c "./build/tests/dataviz_tests"
    ```
    This runs unit and integration tests against a dedicated test database (or a cleaned-up main DB).

2.  **Run natively (after building backend):**
    ```bash
    cd server/build
    ./tests/dataviz_tests
    ```

### Frontend Tests (React with Jest/React Testing Library)

```bash
cd frontend
npm test
```
This will run unit tests for React components and Redux slices.

### API Integration Tests (manual/automated `curl`)

You can use `curl` commands to test API endpoints. Refer to the [API Documentation](#-api-documentation) for endpoint details.
A basic set of `curl` commands is included in the CI/CD pipeline.

### Performance Tests (k6)

1.  **Install k6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Prepare `users.json`:** Create a `k6/scripts/users.json` file with test user credentials (e.g., from `database/seed.sql`).
3.  **Run tests:**
    ```bash
    k6 run k6/scripts/load_test.js
    ```

## 📐 Architecture

Detailed architecture can be found in [ARCHITECTURE.md](ARCHITECTURE.md).

## 📝 API Documentation

API specification is available in [API.md](API.md) (or could be an OpenAPI/Swagger spec).

## 🚀 Deployment Guide

Detailed deployment instructions for production environments are in [DEPLOYMENT.md](DEPLOYMENT.md).

## 🧑‍💻 Contributing

Contributions are welcome! Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
```