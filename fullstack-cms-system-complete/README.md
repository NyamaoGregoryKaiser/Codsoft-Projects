```markdown
# ApexContent: A C++ Enterprise CMS

ApexContent is a high-performance, production-ready Content Management System backend built with C++ and the Drogon web framework. It provides a robust RESTful API for managing users, roles, content types, and content items, complete with essential enterprise features like authentication, authorization, logging, and rate limiting.

This project is designed as a full-stack backend, intended to be consumed by a modern JavaScript frontend framework (e.g., React, Vue, Angular) for a rich user interface.

## Features

*   **User Management:** Register, login, manage users (CRUD), assign roles.
*   **Role-Based Access Control (RBAC):** Define roles (admin, editor, author, user) and assign permissions.
*   **Content Type Management:** Define custom content structures (e.g., Blog Post, Page, Product) using JSON Schema for validation.
*   **Content Item Management:** Create, read, update, delete content instances for defined content types.
*   **Media Asset Management (Basic):** Store metadata and paths for uploaded files.
*   **Authentication & Authorization:** Secure JWT-based authentication for API access.
*   **Logging:** Comprehensive application and request logging.
*   **Error Handling:** Centralized error handling for API endpoints.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Database:** PostgreSQL integration with migrations and seeding.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **Testing:** Unit tests with Google Test, conceptual API tests.
*   **Build System:** CMake for C++ project management.

## Architecture

ApexContent follows a layered architecture:

*   **Controllers:** Handle incoming HTTP requests, parse inputs, and orchestrate responses.
*   **Services:** Encapsulate business logic, acting as an intermediary between controllers and models/database.
*   **Models (ORM):** Represent database entities, generated and extended from Drogon's ORM.
*   **Filters (Middleware):** Pre-process requests (e.g., authentication, rate limiting) before they reach controllers.
*   **Utilities:** Helper functions for common tasks (e.g., password hashing, JWT generation).
*   **Database Layer:** PostgreSQL for data persistence, managed via SQL migrations.

A typical request flow:
`Client Request -> (Docker Proxy) -> RateLimitFilter -> AuthFilter -> Controller -> Service -> Model/DB -> Response`

## Technologies Used

*   **Backend:** C++17, Drogon Web Framework
*   **Database:** PostgreSQL
*   **Authentication:** JSON Web Tokens (JWT), SHA256 (for password hashing, *recommend Argon2/bcrypt for production*)
*   **Build System:** CMake
*   **Containerization:** Docker, Docker Compose
*   **Testing:** Google Test
*   **Logging:** Drogon's built-in logger + custom wrapper
*   **Configuration:** JSON, Environment Variables

## Setup and Running

### Prerequisites

*   **Docker & Docker Compose:** Required to run the application and database.
*   **Git:** To clone the repository.
*   **(Optional) C++ Development Environment:** If you want to build natively or contribute to the C++ code.
    *   GCC/Clang (C++17 compatible)
    *   CMake 3.10+
    *   PostgreSQL development headers (`libpq-dev` on Debian/Ubuntu)
    *   OpenSSL development headers (`libssl-dev`)
    *   Drogon (can be installed system-wide or built as a submodule)
    *   Google Test (for running native unit tests)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/apexcontent.git
cd apexcontent
```

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying from `.env.example`:

```bash
cp .env.example .env
# Edit .env to set your JWT_SECRET and other secrets.
# Ensure JWT_SECRET is a long, random string!
```

**Important:** The `JWT_SECRET` in `.env` **MUST** be set to a strong, random, and long string for production. Do not use the example value.

### 3. Build and Run with Docker Compose

This will build the C++ application Docker image, pull the PostgreSQL image, and start both containers. It will also run database migrations and seed data.

```bash
docker-compose up --build -d
```

Wait a few moments for the containers to start and the database initialization script to complete. You can check the logs:

```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

The application should be running on `http://localhost:8080`.

### 4. Running Natively (Without Docker)

If you wish to build and run the C++ application directly on your host machine:

1.  **Install Dependencies:** Ensure all C++ prerequisites (Drogon, libpq-dev, libssl-dev, Google Test, CMake, build-essential) are installed on your system. Refer to `Dockerfile` for a list of packages.
2.  **Build:**
    ```bash
    mkdir build && cd build
    cmake ..
    make -j$(nproc)
    ```
3.  **Database:** You will need a running PostgreSQL instance accessible from your host. Update `config/config.json` directly or via environment variables to point to your PostgreSQL instance.
4.  **Run Migrations/Seed:** Manually run the SQL scripts in `database/migrations` and `database/seed` against your PostgreSQL database.
5.  **Run Application:**
    ```bash
    cd .. # Back to project root
    ./build/apexcontent
    ```

### 5. Running Tests

#### Unit Tests (Drogon components, utility functions)

To run unit tests (if built natively):
```bash
cd build
./run_unit_tests
```
If using Docker, you can run tests in a new container instance:
```bash
docker-compose run --rm app /app/build/run_unit_tests
```

#### API Tests (Integration/E2E)

The `tests/api/api_tests.sh` script provides a sequence of `curl` commands to test the API endpoints. Ensure your application is running (via Docker Compose or natively) before executing these.

```bash
./tests/api/api_tests.sh
```
*Note: This script uses `jq` for parsing JSON. Install it if you don't have it (`sudo apt-get install jq`).*

## API Endpoints

Refer to `API.md` for detailed API documentation including routes, request/response formats, and examples.

## Frontend Integration

This project provides a robust backend API. For the frontend, you would typically develop a Single Page Application (SPA) using frameworks like React, Vue.js, or Angular. This SPA would make HTTP requests to the `/api/v1/*` endpoints exposed by ApexContent, handling UI rendering, state management, and user interaction.

A very basic `src/views/Login.html` is provided as an example of how Drogon can serve simple HTML, but it's not a full-fledged frontend.

## Contributing

Feel free to fork the repository, open issues, or submit pull requests.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
```