# Enterprise-Grade C++ Content Management System (CMS)

This project provides a comprehensive, production-ready Content Management System built primarily with C++ for the backend, focusing on performance, scalability, and security. It features a robust RESTful API and a lightweight static frontend to demonstrate full-stack capabilities.

## Features

*   **Core C++ Backend (Drogon Framework):**
    *   **User Management:** Register, Login, User CRUD (admin only).
    *   **Content Management:** Articles/Pages CRUD.
    *   **API Endpoints:** Full CRUD operations for core resources.
    *   **Business Logic:** Segregated service layer for complex operations.
*   **Database Layer:**
    *   PostgreSQL for persistent data storage.
    *   Schema definitions and seed data.
*   **Authentication & Authorization:**
    *   JWT (JSON Web Tokens) based authentication.
    *   Role-based authorization (basic admin/user distinction).
*   **Middleware:**
    *   **Logging:** Centralized request and error logging.
    *   **Error Handling:** Global middleware for consistent error responses.
    *   **Caching:** Simple in-memory caching for GET requests.
    *   **Rate Limiting:** IP-based request limiting to prevent abuse.
*   **Frontend:**
    *   Lightweight HTML/CSS/JavaScript SPA to interact with the backend API.
*   **Containerization:**
    *   Docker and Docker Compose for easy setup and deployment.
*   **Testing:**
    *   Unit tests with Google Test for critical components.
    *   Integration tests for service layers.
    *   API tests (conceptual, to be executed via `curl`/Postman).
*   **Documentation:**
    *   Comprehensive README, API documentation, Architecture overview, Deployment guide.
*   **Security:** Password hashing, JWTs, basic input validation.

## Prerequisites

*   Docker and Docker Compose
*   A C++ compiler (GCC/Clang) supporting C++17 or later (for local development/building outside Docker)
*   CMake (for local development/building outside Docker)

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/cms-cpp.git
cd cms-cpp
```

### 2. Configure Environment Variables (Optional, for local build or specific Docker settings)

The `config.json` file in `src/` holds default configurations. For sensitive data like JWT secrets or production database credentials, it's recommended to use environment variables which Docker Compose can pick up.
The `docker-compose.yml` uses environment variables defined directly in the file for demonstration. For production, consider using a `.env` file or Docker secrets.

### 3. Build and Run with Docker Compose (Recommended)

This is the easiest way to get the entire stack (PostgreSQL and C++ app) running.

```bash
docker-compose up --build -d
```

*   `--build`: Builds the C++ application Docker image.
*   `-d`: Runs containers in detached mode.

This will:
1.  Build the `cms-cpp` Docker image.
2.  Start a PostgreSQL container.
3.  Execute `db/schema.sql` and `db/seed.sql` inside the PostgreSQL container (handled by `docker-entrypoint-initdb.d`).
4.  Start the `cms-cpp` application container.

The application will be accessible at `http://localhost:8080`.

### 4. Access the Frontend

Open your web browser and navigate to `http://localhost:8080`. You will see the basic CMS frontend.

### 5. Stop the Application

```bash
docker-compose down
```

## Local Development (Without Docker Compose)

This section is for developers who want to build and run the C++ backend directly on their machine.

### 1. Install Drogon and its Dependencies

Follow the instructions on the [Drogon GitHub page](https://github.com/drogonframework/drogon) to install Drogon. You will also need PostgreSQL client libraries.

### 2. Set up PostgreSQL Database

```bash
# Example: Create a PostgreSQL container manually
docker run --name cms-postgres -e POSTGRES_USER=cms_user -e POSTGRES_PASSWORD=cms_password -e POSTGRES_DB=cms_db -p 5432:5432 -d postgres:13

# Wait for PostgreSQL to start, then connect and run schema/seed scripts
# You might need to install `psql` client locally
psql -h localhost -p 5432 -U cms_user -d cms_db -f db/schema.sql
psql -h localhost -p 5432 -U cms_user -d cms_db -f db/seed.sql
```

Ensure your `src/config.json` or environment variables are set to connect to this database.

### 3. Build the C++ Backend

```bash
cd cms-cpp/src
mkdir build
cd build
cmake ..
make
```

### 4. Run the C++ Backend

```bash
./cms-cpp
```

The application will now be running locally, typically on `http://127.0.0.1:8080` (or as configured in `config.json`).

## Testing

### Running C++ Tests

```bash
cd cms-cpp/test/build # Assuming you've built the tests
cmake ..
make
./cms_test_runner
```

### API Testing

Refer to `API.md` for example `curl` commands to test the endpoints. You can use tools like Postman or Insomnia for more structured API testing.

## Documentation

*   **API Documentation:** [`API.md`](./API.md) - Details all available REST API endpoints.
*   **Architecture Documentation:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Overview of the system design and components.
*   **Deployment Guide:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Instructions for deploying to production environments.

## Contribution

Feel free to fork the repository, open issues, and submit pull requests.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details. (Note: A LICENSE file is not provided in this output, but should be added in a real project).