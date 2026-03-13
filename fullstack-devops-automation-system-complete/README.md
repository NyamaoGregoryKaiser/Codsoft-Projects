# Product Catalog Management System

This is a comprehensive, production-ready full-stack web application designed for managing products and categories, including user authentication and authorization. It serves as a robust example of a DevOps automated system, emphasizing best practices in development, testing, and deployment.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Prerequisites](#prerequisites)
5.  [Setup and Installation](#setup-and-installation)
    *   [Local Development (without Docker)](#local-development-without-docker)
    *   [Local Development (with Docker Compose)](#local-development-with-docker-compose)
6.  [Running Tests](#running-tests)
7.  [API Documentation](#api-documentation)
8.  [Deployment](#deployment)
9.  [CI/CD](#ci/cd)
10. [Environment Variables](#environment-variables)
11. [Contribution](#contribution)
12. [License](#license)

## Features

*   **User Management:** Register, Login, User Profiles, Role-based Access Control (Admin/User).
*   **Product Management:** CRUD operations for products (name, description, price, category, stock).
*   **Category Management:** CRUD operations for product categories.
*   **Authentication & Authorization:** JWT-based authentication, protected routes.
*   **Error Handling:** Centralized middleware for consistent error responses.
*   **Logging:** Winston-powered logging for backend events.
*   **Caching:** In-memory caching for frequently accessed data (e.g., product lists).
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Database Migrations:** TypeORM migrations for schema evolution.
*   **Seed Data:** Scripts to populate the database with initial data.
*   **Comprehensive Testing:** Unit, Integration, and API tests for both backend and frontend.
*   **Containerization:** Dockerfiles for backend and frontend.
*   **Orchestration:** Docker Compose for multi-service local setup.
*   **Reverse Proxy:** Nginx setup to serve frontend and proxy API requests.
*   **CI/CD Pipeline:** GitHub Actions for automated build, test, and (simulated) deployment.

## Architecture

The system follows a typical microservices-ish architecture, separating the backend API, frontend SPA, and database into distinct services. An Nginx reverse proxy acts as the entry point.

*   **Frontend:** React SPA built with Vite.
*   **Backend:** Node.js (Express.js) API built with TypeScript.
*   **Database:** PostgreSQL.
*   **ORM:** TypeORM for database interactions.
*   **Containerization:** Docker.
*   **Orchestration:** Docker Compose.
*   **Reverse Proxy:** Nginx.
*   **CI/CD:** GitHub Actions.

For a detailed architectural overview, refer to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technology Stack

**Backend:**
*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Authentication:** JWT (jsonwebtoken, bcryptjs)
*   **Logging:** Winston
*   **Caching:** Node-cache
*   **Rate Limiting:** express-rate-limit
*   **Testing:** Jest, Supertest

**Frontend:**
*   **Language:** TypeScript
*   **Framework/Library:** React.js
*   **Build Tool:** Vite
*   **Routing:** React Router DOM
*   **HTTP Client:** Axios
*   **State Management:** React Context API
*   **Styling:** Basic CSS (can be extended with TailwindCSS/Styled Components)
*   **Testing:** Jest, React Testing Library

**DevOps/Infrastructure:**
*   **Containerization:** Docker
*   **Orchestration:** Docker Compose
*   **Reverse Proxy:** Nginx
*   **CI/CD:** GitHub Actions

## Prerequisites

Before you begin, ensure you have the following installed:

*   Node.js (LTS version, e.g., 18.x or 20.x)
*   npm or Yarn
*   Docker & Docker Compose (if using Docker setup)
*   PostgreSQL (if running locally without Docker)
*   Git

## Setup and Installation

You can run the application either directly on your local machine or using Docker Compose.

### Local Development (without Docker)

This method requires Node.js, npm, and PostgreSQL to be installed locally.

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/product-catalog-system.git
cd product-catalog-system
```

#### 2. Database Setup (PostgreSQL)

Create a PostgreSQL database. For example:

```sql
CREATE DATABASE product_catalog_db;
CREATE USER myuser WITH PASSWORD 'mypassword';
ALTER ROLE myuser SET client_encoding TO 'utf8';
ALTER ROLE myuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE myuser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE product_catalog_db TO myuser;
```

#### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL connection details and a JWT secret:

```
# .env (backend)
PORT=5000
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/product_catalog_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h
LOG_LEVEL=info
CACHE_TTL=3600 # seconds
```

Run database migrations and seed data:

```bash
npm run migration:run
npm run seed
```

Start the backend in development mode:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`.

#### 4. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit the `.env` file, pointing `VITE_API_BASE_URL` to your backend:

```
# .env (frontend)
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend in development mode:

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

### Local Development (with Docker Compose)

This is the recommended way to run the entire application locally, as it sets up all services (backend, frontend, database, Nginx) in isolated containers.

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/product-catalog-system.git
cd product-catalog-system
```

#### 2. Environment Variables

Create `.env` files for both backend and frontend based on their `.env.example` counterparts.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**backend/.env**:
```
PORT=5000
DATABASE_URL=postgresql://myuser:mypassword@db:5432/product_catalog_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h
LOG_LEVEL=info
CACHE_TTL=3600
```
*Note: `db` is the service name defined in `docker-compose.yml` for the PostgreSQL container.*

**frontend/.env**:
```
VITE_API_BASE_URL=http://localhost:80/api
```
*Note: The frontend will access the backend via the Nginx proxy, which is exposed on port 80.*

#### 3. Build and Run with Docker Compose

From the project root directory:

```bash
docker compose build
docker compose up
```

This will:
*   Build Docker images for backend and frontend.
*   Start the PostgreSQL database service.
*   Start the backend API service.
*   Start the frontend service.
*   Start the Nginx reverse proxy service.
*   Run TypeORM migrations and seed data automatically on backend startup.

The application will be accessible at `http://localhost`.

## Running Tests

### Backend Tests

Navigate to the `backend` directory:

```bash
cd backend
npm test                # Run all tests with coverage report
npm run test:watch      # Run tests in watch mode
```

### Frontend Tests

Navigate to the `frontend` directory:

```bash
cd frontend
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
```

## API Documentation

The comprehensive API documentation can be found in [docs/API.md](docs/API.md).

## Deployment

For detailed deployment instructions, including how to set up the application on a production server (e.g., using a cloud provider, setting up a proper database, configuring Nginx for SSL), refer to [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## CI/CD

This project uses GitHub Actions for Continuous Integration and Continuous Deployment. The workflow is defined in [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml).

The pipeline includes steps for:
1.  **Backend:** Install dependencies, lint, build, run tests (with coverage).
2.  **Frontend:** Install dependencies, lint, build, run tests.
3.  **Docker Build:** Build Docker images for backend and frontend.
4.  **Deployment (Simulated):** A placeholder step that can be extended to push images to a registry and deploy to a Kubernetes cluster, EC2, etc.

## Environment Variables

Ensure you configure the following environment variables:

**Backend (`backend/.env`):**
*   `PORT`: Port for the backend API (e.g., `5000`).
*   `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://myuser:mypassword@localhost:5432/product_catalog_db`).
*   `JWT_SECRET`: Secret key for signing JWT tokens. **Generate a strong, random key for production.**
*   `JWT_EXPIRES_IN`: Expiration time for JWT tokens (e.g., `1h`, `7d`).
*   `LOG_LEVEL`: Logging level (e.g., `info`, `debug`, `warn`, `error`).
*   `CACHE_TTL`: Time-to-live for cached items in seconds.

**Frontend (`frontend/.env`):**
*   `VITE_API_BASE_URL`: Base URL for the backend API (e.g., `http://localhost:5000/api` or `http://localhost:80/api` when using Nginx).

## Contribution

Feel free to fork the repository, open issues, and submit pull requests.

## License

This project is licensed under the ISC License.

---
### 2. `docs/ARCHITECTURE.md`