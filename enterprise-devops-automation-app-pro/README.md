# E-commerce Product Management System

This is a comprehensive, production-ready full-stack web application designed for managing e-commerce products. It features a Node.js/Express backend, a React frontend, a PostgreSQL database, Docker containerization, and a robust CI/CD pipeline with GitHub Actions. It implements various enterprise-grade features including authentication, caching, logging, rate limiting, and extensive testing.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technologies Used](#technologies-used)
4.  [Setup and Local Development](#setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
    *   [Running with Docker Compose](#running-with-docker-compose)
    *   [Running Backend Locally (without Docker)](#running-backend-locally-without-docker)
    *   [Running Frontend Locally (without Docker)](#running-frontend-locally-without-docker)
5.  [Database Management](#database-management)
6.  [Testing](#testing)
7.  [CI/CD Pipeline](#cicd-pipeline)
8.  [API Documentation](#api-documentation)
9.  [Deployment Guide](#deployment-guide)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## 1. Features

*   **User Management:**
    *   User registration and login (JWT-based authentication).
    *   Admin and regular user roles with role-based authorization.
    *   Admin can view and delete users.
*   **Product Management:**
    *   CRUD operations for products (Create, Read, Update, Delete).
    *   Products are associated with users (owner).
    *   Only owner or admin can update/delete products.
    *   Publicly viewable product list and details.
*   **Performance & Scalability:**
    *   Redis caching for frequently accessed data (products, users).
    *   Rate limiting to prevent abuse.
    *   Optimized database queries with eager loading.
*   **Security:**
    *   JWT authentication with secure token handling.
    *   Password hashing using `bcryptjs`.
    *   Helmet, HPP, XSS-clean for common web vulnerabilities.
    *   Environment variable management.
*   **Observability:**
    *   Structured logging with Winston for backend requests and errors.
    *   Error handling middleware for consistent API responses.
*   **Development & Operations:**
    *   Docker and Docker Compose for containerization.
    *   Automated CI/CD with GitHub Actions (Build, Test, Deploy).
    *   Comprehensive unit and integration tests.
    *   Clear project structure and documentation.
*   **User Interface (Frontend):**
    *   Responsive React application with React Router.
    *   Login/Register forms.
    *   Product listing and detail pages.
    *   User dashboard for managing own products.
    *   Admin panel for user management.

## 2. Architecture

The application follows a client-server architecture, typically deployed with Docker containers for each major component.

*   **Client (Frontend):** A React application providing the user interface. It communicates with the backend API using Axios.
*   **Server (Backend):** A Node.js Express API that handles business logic, interacts with the database, and serves data to the frontend.
*   **Database (PostgreSQL):** A relational database used for persistent storage of users and product data. Sequelize is used as the ORM.
*   **Cache (Redis):** An in-memory data store used to cache frequently accessed data, reducing database load and improving response times.
*   **Docker:** Containerization platform for packaging the application and its dependencies into isolated containers.
*   **Docker Compose:** Tool for defining and running multi-container Docker applications (backend, frontend, database, Redis).
*   **CI/CD (GitHub Actions):** Automates the build, test, and deployment process upon code changes.

```mermaid
graph TD
    User((User)) -- HTTP/HTTPS --> Frontend[React Frontend]
    Frontend -- HTTP/HTTPS (API Calls) --> Backend[Node.js Backend API]

    subgraph Backend Services
        Backend -- ORM (Sequelize) --> Database(PostgreSQL DB)
        Backend -- Caching --> Redis(Redis Cache)
        Backend -- Logging --> Logging(Winston Logger)
    end

    subgraph Infrastructure
        Frontend -- Containerized --> DockerFrontend[Docker Container]
        Backend -- Containerized --> DockerBackend[Docker Container]
        Database -- Containerized --> DockerDB[Docker Container]
        Redis -- Containerized --> DockerRedis[Docker Container]
    end

    DockerFrontend -- Orchestration --> DockerCompose(Docker Compose / Kubernetes)
    DockerBackend -- Orchestration --> DockerCompose
    DockerDB -- Orchestration --> DockerCompose
    DockerRedis -- Orchestration --> DockerCompose

    CodeRepository[GitHub Repository] -- Push --> GitHubActions[GitHub Actions CI/CD]
    GitHubActions -- Build & Test --> DockerHub(Docker Hub / Container Registry)
    GitHubActions -- Deploy --> ProductionServer[Production Server]
    ProductionServer -- Runs --> DockerCompose
```

## 3. Technologies Used

*   **Frontend:**
    *   React.js
    *   React Router DOM
    *   Axios
    *   Tailwind CSS (for styling)
    *   `jwt-decode`
*   **Backend:**
    *   Node.js
    *   Express.js
    *   Sequelize (ORM)
    *   PostgreSQL
    *   Redis
    *   `bcryptjs` (password hashing)
    *   `jsonwebtoken` (JWT)
    *   `winston` (logging)
    *   `express-rate-limit` (rate limiting)
    *   `helmet`, `hpp`, `xss-clean`, `cors` (security)
*   **Development Tools:**
    *   Docker
    *   Docker Compose
    *   `nodemon` (backend hot-reloading)
    *   `sequelize-cli` (database migrations/seeding)
    *   ESLint, Prettier (code quality)
    *   Jest, Supertest, React Testing Library (testing)
*   **CI/CD:**
    *   GitHub Actions
*   **Documentation:**
    *   Markdown

## 4. Setup and Local Development

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/en/) (v18 or higher)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually comes with Docker Desktop)

### Environment Variables

Copy the `.env.example` file at the root of the project to a new file named `.env` and fill in the values.
Do the same for `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`.
The root `.env` is for Docker Compose, `server/.env` is for local backend development, and `client/.env` is for local frontend development. When running with Docker Compose, the variables from the root `.env` will override the service-specific `.env` files.

**`.env` (root)**

```
POSTGRES_USER=your_pg_user
POSTGRES_PASSWORD=your_pg_password
POSTGRES_DB=ecommerce_db
POSTGRES_PORT=5432

BACKEND_PORT=5000
JWT_SECRET=super_secret_jwt_key_please_change_this_in_production
JWT_EXPIRES_IN=7d
REDIS_PASSWORD=super_secret_redis_password_please_change_this_in_production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info

CLIENT_PORT=3000
REACT_APP_API_BASE_URL=http://localhost:5000/api # Points to host-mapped backend port

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASS=super_secret_redis_password_please_change_this_in_production
```

**`server/.env` (for local backend dev)**

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://your_pg_user:your_pg_password@localhost:5432/ecommerce_db # Connects to local PostgreSQL or dockerized DB directly
JWT_SECRET=your_jwt_secret_key_change_me
JWT_EXPIRES_IN=1h
REDIS_HOST=localhost # If Redis is running locally or via docker port-mapped
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_change_me
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CLIENT_URL=http://localhost:3000
```

**`client/.env` (for local frontend dev)**

```
REACT_APP_API_BASE_URL=http://localhost:5000/api # Points to local backend server
```

### Running with Docker Compose (Recommended)

This method spins up the entire application stack (PostgreSQL, Redis, Backend, Frontend) using Docker containers.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Create `.env` files:**
    Copy `.env.example` to `.env` in the root directory and fill in your details.
    (For Docker Compose, you typically only need the root `.env` to configure services, as the Dockerfiles and `docker-compose.yml` handle passing these to containers.)
3.  **Build and run the containers:**
    ```bash
    docker compose up --build -d
    ```
    *   `--build`: Builds the images if they don't exist or if changes were made to Dockerfiles.
    *   `-d`: Runs the containers in detached mode (in the background).

4.  **Wait for services to become healthy:**
    It might take a minute or two for the database and backend to fully initialize, run migrations, and seed data.
    You can check the logs:
    ```bash
    docker compose logs -f backend
    ```
    Look for messages like `Database synchronized` and `Server running on port 5000`.

5.  **Access the application:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:5000/api`

6.  **Stop the containers:**
    ```bash
    docker compose down
    ```
    This stops and removes containers, networks, and volumes. To preserve data, omit removing volumes: `docker compose down --volumes`.

### Running Backend Locally (without Docker for backend, but using Docker for DB/Redis)

This is useful if you want faster iteration on backend code changes with `nodemon` and don't want to rebuild the Docker image constantly. You'll need `npm install` for the `server` directory.

1.  **Start Database and Redis with Docker Compose:**
    ```bash
    docker compose up db redis -d
    ```
2.  **Navigate to the `server` directory:**
    ```bash
    cd server
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Create `server/.env`:**
    Copy `server/.env.example` to `server/.env` and adjust `DATABASE_URL` to point to `localhost:5432` and `REDIS_HOST` to `localhost`.
5.  **Run migrations and seed data:**
    ```bash
    npm run migrate
    npm run seed
    ```
6.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend will run on `http://localhost:5000`.

### Running Frontend Locally (without Docker)

This is useful for faster iteration on frontend code changes with React's dev server. You'll need `npm install` for the `client` directory.

1.  **Ensure backend is running** (either via `docker compose up` for the full stack or `npm run dev` locally as described above).
2.  **Navigate to the `client` directory:**
    ```bash
    cd client
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Create `client/.env`:**
    Copy `client/.env.example` to `client/.env` and ensure `REACT_APP_API_BASE_URL` points to your running backend (e.g., `http://localhost:5000/api`).
5.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

## 5. Database Management

The backend uses `sequelize-cli` for database migrations and seeding.

*   **Run Migrations:** Apply all pending migrations to the database.
    ```bash
    cd server
    npm run migrate
    ```
*   **Undo Last Migration:** Revert the most recent migration.
    ```bash
    cd server
    npm run migrate:undo
    ```
*   **Seed Database:** Populate the database with initial data (e.g., admin user, sample products).
    ```bash
    cd server
    npm run seed
    ```
*   **Undo All Seeds:** Remove all seeded data.
    ```bash
    cd server
    npm run seed:undo
    ```
**Note:** When running with `docker compose up`, migrations and seeds are automatically run as part of the backend service's startup command.

## 6. Testing

The project has a comprehensive testing suite.

*   **Backend Tests:**
    *   **Unit Tests:** For controllers, models, and utility functions using Jest.
    *   **Integration Tests:** For API endpoints using Supertest to simulate HTTP requests.
    *   To run backend tests:
        ```bash
        cd server
        npm test
        ```
        (Coverage report is generated automatically by Jest configuration)

*   **Frontend Tests:**
    *   **Unit/Component Tests:** For React components and hooks using Jest and React Testing Library.
    *   API requests are mocked using `msw` (Mock Service Worker) for isolated testing.
    *   To run frontend tests:
        ```bash
        cd client
        npm test
        ```
        (Coverage report is generated automatically by Jest configuration)

*   **Performance Tests (Conceptual):**
    *   Uses `k6` to simulate load and measure API performance.
    *   A sample script `server/tests/performance/k6_load_test.js` is provided.
    *   To run (ensure k6 is installed and backend is running):
        ```bash
        cd server/tests/performance
        k6 run k6_load_test.js
        ```

**Test Coverage Goal:** Aiming for 80%+ test coverage for both backend and frontend.

## 7. CI/CD Pipeline

The project utilizes GitHub Actions for Continuous Integration and Continuous Deployment.

**`.github/workflows/main.yml`:**
This workflow is triggered on pushes and pull requests to `main` and `develop` branches.

**Stages:**

1.  **`build-and-test`**:
    *   Checks out the code.
    *   Sets up Node.js.
    *   Configures environment variables for testing.
    *   Installs backend and frontend dependencies.
    *   Runs ESLint for both backend and frontend.
    *   Executes Jest tests for both backend and frontend (with coverage).
    *   Builds the React frontend for production.
    *   **Conditional Docker Build & Push:** If on `main` branch, it logs into Docker Hub and builds/pushes Docker images for both backend and frontend, tagged with the commit SHA and `latest`. Requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` GitHub secrets.
2.  **`deploy`**:
    *   **Conditional Deployment:** Runs only on `main` branch after `build-and-test` succeeds.
    *   Deploys to a remote server using SSH.
    *   Assumes a `docker compose` setup on the remote server.
    *   Logs into Docker Hub on the remote server.
    *   Creates or updates the `.env` and `docker-compose.yml` files with production-ready configurations (using GitHub secrets for sensitive data like `PROD_POSTGRES_USER`, `PROD_JWT_SECRET`, etc.).
    *   Pulls the latest Docker images from Docker Hub.
    *   Brings up the new services with `docker compose up -d --remove-orphans`.
    *   Requires `SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, and production specific `PROD_` secrets.

**GitHub Secrets Required:**
*   `DOCKER_USERNAME`
*   `DOCKER_PASSWORD`
*   `SSH_PRIVATE_KEY` (Base64 encoded)
*   `DEPLOY_HOST`
*   `DEPLOY_USER`
*   `PROD_POSTGRES_USER`
*   `PROD_POSTGRES_PASSWORD`
*   `PROD_POSTGRES_DB`
*   `PROD_JWT_SECRET`
*   `PROD_REDIS_PASSWORD`
*   `PROD_CLIENT_URL` (e.g., `https://yourdomain.com`)
*   `PROD_API_BASE_URL` (e.g., `https://api.yourdomain.com/api` or `https://yourdomain.com/api`)

## 8. API Documentation

The backend API exposes the following endpoints:

*   **Authentication:**
    *   `POST /api/auth/register`: Register a new user.
    *   `POST /api/auth/login`: Log in and get a JWT token.
    *   `GET /api/auth/logout` (Protected): Log out the current user.
    *   `GET /api/auth/me` (Protected): Get details of the current logged-in user.
*   **User Management (Admin Only, Protected):**
    *   `GET /api/users`: Get all users.
    *   `POST /api/users`: Create a new user.
    *   `GET /api/users/:id`: Get a user by ID.
    *   `PATCH /api/users/:id`: Update a user by ID.
    *   `DELETE /api/users/:id`: Delete a user by ID.
*   **Product Management:**
    *   `GET /api/products`: Get all products (Public).
    *   `GET /api/products/:id`: Get a single product by ID (Public).
    *   `POST /api/products` (Protected): Create a new product.
    *   `PATCH /api/products/:id` (Protected, Owner/Admin): Update a product by ID.
    *   `DELETE /api/products/:id` (Protected, Owner/Admin): Delete a product by ID.

**Error Responses:**
All API errors are handled by a centralized error middleware, returning a consistent JSON format:
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error message details"
  // "stack": "stack trace (only in development)"
}
```

For more detailed API documentation (e.g., request/response schemas, parameter details), a tool like **Swagger/OpenAPI** could be integrated. You would typically generate an `openapi.yaml` or `swagger.json` file and serve it via a UI (e.g., `swagger-ui-express`).

## 9. Deployment Guide

The `deploy` job in `.github/workflows/main.yml` provides a blueprint for deployment to a remote server. Here's a conceptual guide:

1.  **Provision a Server:**
    *   A Linux VM (e.g., Ubuntu, CentOS) on a cloud provider (AWS EC2, DigitalOcean Droplet, Google Cloud Compute Engine, Azure VM).
    *   Ensure SSH access is configured.
    *   Install Docker and Docker Compose on the server.

2.  **Configure GitHub Secrets:**
    *   Set up all necessary GitHub secrets in your repository settings (`Settings > Secrets > Actions`). These include Docker Hub credentials, SSH key for your deployment user, and production environment variables for your database, JWT, Redis, etc.
    *   The `SSH_PRIVATE_KEY` should be the private key corresponding to the public key authorized on your deployment server. For security, ensure it's base64 encoded if passing directly, or handle newline characters.

3.  **DNS Configuration:**
    *   Point your domain's `A` record (e.g., `yourdomain.com`) to your server's public IP address.
    *   Consider setting up a subdomain for your API (e.g., `api.yourdomain.com`) or using path-based routing (`yourdomain.com/api`).
    *   Update `REACT_APP_API_BASE_URL` in the frontend Dockerfile build arguments and in the `docker-compose.yml` on the server to reflect the production API endpoint.

4.  **SSL/TLS (HTTPS):**
    *   **Highly Recommended for Production.**
    *   Use a reverse proxy like Nginx or Caddy on the host machine (outside Docker Compose) to handle SSL termination and forward traffic to your Dockerized frontend (port 80) and backend (e.g., port 5000/8080).
    *   Tools like `certbot` (Let's Encrypt) can automate SSL certificate issuance and renewal for Nginx/Caddy.
    *   Alternatively, you can integrate a reverse proxy and `certbot` within Docker Compose, but this adds complexity to initial setup.

5.  **Database Externalization (Optional but Recommended for High Availability):**
    *   For production, consider using a managed database service (e.g., AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL) instead of a Docker container for PostgreSQL. This offers better scalability, backups, and failover.
    *   If using a managed DB, update `DATABASE_URL` in your production `.env` to connect to the managed service endpoint.

6.  **Monitoring & Logging:**
    *   Beyond basic `winston` file logging, integrate a centralized logging solution (e.g., ELK Stack, Grafana Loki, Datadog) to aggregate logs from all containers.
    *   Set up monitoring (e.g., Prometheus & Grafana) to track application metrics, server health, and container performance.

## 10. Future Enhancements

*   **Orders & Cart Module:** Add full e-commerce functionality with shopping cart, order placement, and order history.
*   **Payment Gateway Integration:** Integrate with Stripe, PayPal, etc.
*   **Image Uploads:** Implement secure cloud storage for product images (e.g., AWS S3, Cloudinary).
*   **Search & Filtering:** Advanced product search, filtering, and sorting capabilities.
*   **Admin Dashboard:** More comprehensive admin features for managing products, orders, and users.
*   **GraphQL API:** Consider migrating to GraphQL for more flexible data fetching.
*   **WebSockets:** For real-time updates (e.g., stock changes, order status).
*   **Load Balancing & Scaling:** Use a load balancer (e.g., Nginx, AWS ALB) and scale backend/frontend horizontally (e.g., Kubernetes).
*   **Container Orchestration:** Deploy on Kubernetes for advanced scaling, self-healing, and management.
*   **API Gateway:** Implement an API Gateway (e.g., Kong, AWS API Gateway) for traffic management, security, and analytics.

## 11. License

This project is open-sourced under the MIT License. See the `LICENSE` file for more details.
```