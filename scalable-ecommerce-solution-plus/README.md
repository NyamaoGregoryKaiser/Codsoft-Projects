```markdown
# E-Commerce System (C++ Backend)

This repository contains the comprehensive C++ backend for a production-ready e-commerce solution.
It provides RESTful APIs for user management, product catalog, shopping cart, and order processing,
built with the Drogon web framework and PostgreSQL.

## Features

*   **User Management:** Registration, Login (JWT), User Profiles, Role-Based Access Control (RBAC).
*   **Product Catalog:** CRUD operations for products and categories, product search.
*   **Shopping Cart:** Add/remove items, update quantities.
*   **Order Management:** Order creation, status tracking, order history.
*   **Authentication & Authorization:** JWT-based.
*   **Logging & Monitoring:** Structured logging with `spdlog`.
*   **Error Handling:** Centralized exception handling with custom API exceptions.
*   **Caching:** Redis integration for frequently accessed data (e.g., product details, sessions).
*   **Rate Limiting:** Protects against abuse and ensures fair usage.
*   **Containerization:** Docker for easy deployment and development.
*   **CI/CD:** Automated build, test, and deployment workflows with GitHub Actions.
*   **Database:** PostgreSQL with well-defined schema, migrations, and seed data.
*   **Testing:** Unit, Integration, and API tests.

## Technologies Used

*   **Backend:** C++17/20, Drogon (Web Framework), Conan (Dependency Manager)
*   **Database:** PostgreSQL
*   **Caching/Rate Limiting:** Redis
*   **Authentication:** JWT-cpp
*   **Logging:** spdlog
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** Google Test (Unit Tests)

## Getting Started

### Prerequisites

*   Git
*   Docker & Docker Compose
*   Conan (for local development outside Docker, though Docker is recommended)
*   CMake (for local development)
*   C++ Compiler (GCC 11+ or Clang 11+)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ecommerce-system.git
cd ecommerce-system
```

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example` and filling in your desired values.
**Crucially, generate a strong, random `JWT_SECRET` for production.**

```bash
cp .env.example .env
# Edit .env with your secrets and desired settings
```

### 3. Run with Docker Compose (Recommended)

This will spin up the PostgreSQL database, Redis, and the C++ backend application.

```bash
docker-compose up --build -d
```

*   `--build`: Rebuilds your application Docker image. Use this if you've changed C++ code.
*   `-d`: Runs containers in detached mode.

**To stop:**
```bash
docker-compose down
```
**To stop and remove volumes (cleans database data!):**
```bash
docker-compose down -v
```

### 4. Access the API

The backend API will be available at `http://localhost:8080` (or the `APP_PORT` you configured in `.env`).

*   **Example Endpoint:** `GET http://localhost:8080/api/v1/products`

You can use `curl`, Postman, or your browser to test.

### 5. Local Development (Without Docker Compose for Backend)

If you prefer to run the C++ backend locally while still using Docker for DB/Redis:

1.  **Start Database and Redis with Docker Compose:**
    ```bash
    docker-compose up db redis -d
    ```
2.  **Install Conan Dependencies:**
    ```bash
    conan profile detect --force
    conan install . --output-folder=build --build=missing -s build_type=Debug
    ```
3.  **Build the Application:**
    ```bash
    cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=./build/conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ```
4.  **Run the Application:**
    ```bash
    ./build/bin/ECommerceSystem
    ```
    Ensure your `.env` is correctly set for `DB_HOST=localhost` (or the IP of your Docker DB service) and `REDIS_HOST=localhost`.

## Testing

### Unit Tests

Unit tests are written using Google Test and mock objects.

```bash
cd build
ctest --output-on-failure
```
To run specific tests: `./bin/run_tests --gtest_filter=UserServiceTest.RegisterUserSuccess`

### Integration Tests & API Tests

Integration and API tests are designed to run against a running instance of the application (preferably a test environment).
These are typically run as part of the CI/CD pipeline. Manual testing can be done with Postman/Insomnia.

## Contribution

Contributions are welcome! Please fork the repository and open a pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---
```