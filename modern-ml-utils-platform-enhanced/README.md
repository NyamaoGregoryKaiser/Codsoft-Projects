```markdown
# MLOps Core Service

## Comprehensive, Production-Ready Machine Learning Utilities System

This project provides a robust, enterprise-grade backend service written in C++ for managing and serving Machine Learning models. It's designed to be a core component of an MLOps platform, focusing on model registration, versioning, and high-performance prediction serving.

### Features

1.  **Core Application (C++)**:
    *   **Backend**: C++17 with `Crow` web framework for a high-performance REST API.
    *   **Modules**: Model repository, Prediction service, Caching layer.
    *   **Business Logic**: CRUD operations for models and their versions, active version management, prediction logging.
    *   **API Endpoints**: Full RESTful API for managing models, versions, and serving predictions.
2.  **Database Layer**:
    *   **Database**: SQLite (for demonstration; easily swappable with PostgreSQL/MySQL).
    *   **Schema**: `models`, `model_versions`, `prediction_logs` tables.
    *   **Migration Scripts**: Python-based migration system for schema evolution.
    *   **Seed Data**: Initial data for quick setup and testing.
3.  **Configuration & Setup**:
    *   `config/default.json`: Centralized application configuration.
    *   `CMakeLists.txt`: C++ build system configuration.
    *   `requirements.txt`: Python dependencies for scripts and tests.
    *   `Dockerfile`: Containerization for easy deployment.
    *   `docker-compose.yml`: Orchestration for the backend service.
    *   `.gitlab-ci.yml`: Example CI/CD pipeline configuration (build, test, deploy).
4.  **Testing & Quality**:
    *   **Unit Tests**: C++ with Google Test (80%+ coverage for core components).
    *   **Integration Tests**: Python with `pytest` and `requests` against the running API.
    *   **API Tests**: Covered by integration tests.
    *   **Performance Tests**: Python with `Locust` for load generation.
5.  **Documentation**:
    *   `README.md`: This comprehensive guide.
    *   `API.md`: Detailed API reference.
    *   `ARCHITECTURE.md`: High-level system design.
    *   `DEPLOYMENT.md`: Step-by-step deployment instructions.
6.  **Additional Features**:
    *   **Authentication/Authorization**: JWT-based authentication middleware with role-based authorization (admin, predictor, viewer).
    *   **Logging**: Custom C++ logging utility for structured logs.
    *   **Error Handling**: Global API error handling middleware for consistent JSON responses.
    *   **Caching Layer**: In-memory LRU cache for frequently accessed model version metadata.
    *   **Rate Limiting**: (Conceptual - can be added via Crow middleware or API Gateway in a real scenario, not implemented explicitly in this core C++ due to `Crow`'s simplicity, but structure allows it).

### Technologies Used

*   **Backend**: C++17, [Crow](https://github.com/ipkn/crow) (web framework), [nlohmann/json](https://github.com/nlohmann/json) (JSON library), [sqlite_orm](https://github.com/fnc12/sqlite_orm) (SQLite ORM), [jwt-cpp](https://github.com/Thalhammer/jwt-cpp) (JWT library).
*   **Database**: SQLite3.
*   **Build System**: CMake.
*   **Testing**: [Google Test](https://github.com/google/googletest), [pytest](https://docs.pytest.org/), [requests](https://docs.python-requests.org/en/latest/), [Locust](https://locust.io/).
*   **Containerization**: Docker, Docker Compose.
*   **CI/CD**: GitLab CI.
*   **Scripting**: Python.

### Getting Started

#### Prerequisites

*   **C++ Development**:
    *   C++17 compatible compiler (g++, clang++)
    *   CMake (3.10+)
    *   `libsqlite3-dev` (or equivalent for your OS)
    *   `libssl-dev` (or equivalent for your OS, for `jwt-cpp`'s cryptographic operations)
*   **Python Development**:
    *   Python 3.8+
    *   `pip`
*   **Containerization**:
    *   Docker
    *   Docker Compose

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mlops-core-service.git
cd mlops-core-service
```

#### 2. Install Third-Party C++ Dependencies

This project uses some header-only libraries and some that require specific includes. They are included as `src/third_party` submodules for simplicity.

```bash
# Initialize and update submodules (Crow, nlohmann/json, sqlite_orm, jwt-cpp, googletest)
git submodule update --init --recursive
```

#### 3. Python Environment Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### 4. Build the C++ Application

```bash
mkdir -p build
cd build
cmake ..
cmake --build . --config Release # Use --config Release for optimized build on Windows/MSVC
cd ..
```
This will compile the `mlops-core-service` executable into the `build/` directory.

#### 5. Database Setup (Migrations & Seeding)

The C++ application uses SQLite. The `scripts/db/migrate.py` script helps manage the schema.

```bash
source .venv/bin/activate # Activate Python virtual environment if not already
python scripts/db/full # Resets DB, applies all migrations, and seeds initial data
```
This will create `data/mlops_core.db` and populate it with sample models and versions.

#### 6. Run the Application

##### Local Development (from build directory)

```bash
source .venv/bin/activate # Activate Python virtual environment if not already
./build/mlops-core-service config/default.json
```
The server will start on `http://localhost:18080` (or the port specified in `config/default.json`).

##### Docker Compose (recommended for production-like environment)

```bash
docker-compose up --build -d
```
This will build the Docker image, create the `mlops-backend` service, mount volumes for data/logs/models, and start the application in the background. Access it at `http://localhost:18080`.

To stop:
```bash
docker-compose down
```

### Testing

#### Run C++ Unit Tests

```bash
cd build
./mlops-unit-tests
cd ..
```

#### Run Python Integration Tests

These tests require the C++ service to be running.
If running locally:
1.  Start the C++ service (either `./build/mlops-core-service` or `docker-compose up`).
2.  Activate your Python virtual environment.
3.  Run the tests:
    ```bash
    pytest tests/integration/integration_test.py
    ```

If running with `docker-compose` only for testing:
The `docker-compose.yml` can be extended with a test runner service that depends on the backend. For CI, the `.gitlab-ci.yml` demonstrates how to run integration tests against a temporary Docker service.

#### Run Performance Tests (Locust)

1.  Ensure the C++ service is running (e.g., via `docker-compose up`).
2.  Activate your Python virtual environment.
3.  Start Locust in web UI mode:
    ```bash
    locust -f scripts/perf/locustfile.py --host http://localhost:18080
    ```
4.  Open your browser to `http://localhost:8089`, enter the number of users, spawn rate, and `http://localhost:18080` as the host, then start the test.

Alternatively, run in headless mode for a quick run or CI:
```bash
locust -f scripts/perf/locustfile.py --host=http://localhost:18080 --users 10 --spawn-rate 5 --run-time 60s --html test_results/locust_report.html --exit-code-on-error 1
```

### Authentication

The API uses JWT for authentication. You need a token to access most endpoints.
Use the `scripts/generate_jwt.py` utility:

```bash
source .venv/bin/activate
python scripts/generate_jwt.py --user_id 1 --role admin --secret "your_super_secret_jwt_key_here_for_prod_use_a_strong_one_and_env_var" --output admin_token.txt
```
Replace the `--secret` with the value from your `config/default.json` or environment variable.
The generated token can then be used in the `Authorization` header: `Bearer <YOUR_TOKEN>`.

### Project Structure

Refer to the project structure diagram at the top of this README for a high-level overview.

---

### Further Documentation

*   `API.md`: Detailed API reference.
*   `ARCHITECTURE.md`: System architecture overview.
*   `DEPLOYMENT.md`: Comprehensive deployment guide.

```
```