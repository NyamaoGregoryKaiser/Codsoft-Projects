# ML Utilities Hub

## Comprehensive, Production-Ready Machine Learning Utilities System

This project is a full-stack web application designed to provide essential utilities for Machine Learning workflows. It features a robust Node.js/Express backend with TypeScript, a dynamic React frontend with Chakra UI, a PostgreSQL database, and enterprise-grade elements such as authentication, logging, caching, and Dockerization.

The system focuses on common ML data preprocessing and feature engineering tasks, offering a platform to manage datasets and apply transformations.

## Features

### Core Application
*   **Backend (Node.js/Express, TypeScript)**:
    *   RESTful API with `express.json()` and `express.urlencoded()`.
    *   Modular structure (Auth, Users, Datasets, Data Utilities).
    *   Error handling middleware for consistent API responses.
    *   Winston for robust logging.
    *   TypeORM for database interactions.
*   **Frontend (React, Chakra UI)**:
    *   Responsive UI built with Chakra UI.
    *   React Router for navigation.
    *   Axios for API communication with interceptors for auth.
    *   AuthContext for global authentication state management.
    *   Pages for Login, Register, Dashboard, Datasets (List/Detail/CRUD), Data Utilities.
*   **ML Utilities**:
    *   **Data Preprocessing**: One-Hot Encoding for categorical features.
    *   **Feature Scaling**: Min-Max Scaling for numerical features.
    *   **Dataset Management**: CRUD operations for dataset metadata (name, description, file path).

### Database Layer
*   **PostgreSQL**: Robust relational database.
*   **TypeORM**: Powerful ORM for seamless interaction with the database.
*   **Schema Definitions**: `User` and `Dataset` entities.
*   **Migration Scripts**: Manages database schema changes (`1700000000000-InitialMigration.ts`).
*   **Seed Data**: Initial admin user setup (`seed.ts`).

### Configuration & Setup
*   **`package.json`**: For both backend and frontend, listing all dependencies.
*   **`.env.example`**: Clear environment variable configuration for development.
*   **Docker Setup**:
    *   `Dockerfile` for backend (Node.js).
    *   `Dockerfile` for frontend (Node.js with `serve` for static assets).
    *   `docker-compose.yml`: Orchestrates PostgreSQL, Redis, Backend, and Frontend services.
*   **CI/CD Pipeline**: Conceptual `ci-cd.yml` using GitHub Actions for build, test, and deployment stages.

### Testing & Quality
*   **Unit Tests (Jest)**: For core services (e.g., `auth.service.ts`, `data-utility.service.ts`) aiming for high coverage.
*   **Integration/API Tests (Jest, Supertest)**: For controllers and API endpoints (`auth.test.ts`, `datasets.test.ts`, `data-utilities.test.ts`).
*   **Performance Tests (Artillery)**: `artillery_performance_test.yml` configuration for load testing API endpoints.

### Additional Features
*   **Authentication/Authorization**: JWT-based authentication via `jsonwebtoken` and `bcryptjs`. `protect` middleware ensures secure routes.
*   **Logging and Monitoring**: `Winston` for structured logging.
*   **Error Handling Middleware**: Centralized error handling for consistent API responses.
*   **Caching Layer**: `Redis` integration with `ioredis` and a custom Express middleware for GET route caching.
*   **Rate Limiting**: `express-rate-limit` middleware to prevent abuse on auth routes.
*   **Security**: `helmet` for setting various security HTTP headers and `cors` for Cross-Origin Resource Sharing.

---

## Getting Started

Follow these instructions to set up and run the project locally using Docker.

### Prerequisites

*   Docker Desktop (or Docker Engine & Docker Compose) installed and running.
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ml-utilities-hub.git
cd ml-utilities-hub
```

### 2. Configure Environment Variables

Create `.env` files for both backend and frontend based on the examples.

```bash
# For backend
cp backend/.env.example backend/.env

# For frontend
cp frontend/.env.example frontend/.env
```

**backend/.env (Example content - adjust as needed):**
```
NODE_ENV=development
PORT=5000

DB_TYPE=postgres
DB_HOST=db
DB_PORT=5432
DB_USERNAME=ml_user
DB_PASSWORD=ml_password
DB_DATABASE=ml_utilities_db

JWT_SECRET=supersecretjwtkey # CHANGE THIS IN PRODUCTION
JWT_EXPIRES_IN=1h

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD= # Leave empty if no password

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```
*Note*: `DB_HOST` and `REDIS_HOST` are set to service names (`db`, `redis`) because containers communicate over the Docker network.

**frontend/.env (Example content - adjust if your backend port changes):**
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Run with Docker Compose

Use the provided setup script to build and start all services. This script also handles initial database setup (migrations and seeding).

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will:
1.  Check if Docker is running.
2.  Create `.env` files if they don't exist.
3.  Build Docker images for backend and frontend.
4.  Start `db` (PostgreSQL), `redis`, `backend`, and `frontend` containers.
5.  The backend container will automatically run TypeORM migrations and seed an initial admin user (`admin@example.com` with password `password123`).
6.  Wait for services to be healthy.

### 4. Access the Application

Once the `setup.sh` script completes:

*   **Frontend**: Access the web application in your browser at `http://localhost:3000`
*   **Backend API**: The API is available at `http://localhost:5000/api/v1`

You can log in with the seeded admin user:
*   **Email**: `admin@example.com`
*   **Password**: `password123`

### 5. Stopping and Restarting

To stop all services:
```bash
docker compose down
```

To restart:
```bash
docker compose up -d
```

### 6. Running Tests

#### Backend Tests

Navigate to the `backend` directory and run tests:
```bash
cd backend
npm test
# For coverage report:
npm run test:cov
```
*Note*: The `npm test` command will use a separate test database (`ml_utilities_test_db`) and will clear/re-migrate it on `beforeAll` of the test suite.

#### Frontend Tests
*   (Placeholder for frontend tests like Jest/Vitest with React Testing Library)
    *   If you had these, you would typically run them inside the `frontend` directory: `cd frontend && npm test`

#### Performance Tests
Ensure your Docker Compose setup is running, then from the project root:
```bash
npm install -g artillery # Install Artillery if you haven't already
artillery run scripts/artillery_performance_test.yml
```

---

## API Documentation

See [docs/api.md](docs/api.md) for detailed API endpoints.

## Architecture Documentation

See [docs/architecture.md](docs/architecture.md) for an overview of the system architecture.

## Deployment Guide

See [docs/deployment.md](docs/deployment.md) for conceptual deployment instructions using Docker and CI/CD.

---

## Contributing

Feel free to fork the repository, open issues, or submit pull requests.

## License

This project is licensed under the MIT License.