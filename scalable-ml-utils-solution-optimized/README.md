# ML Utilities System

A comprehensive, production-ready full-stack web application for managing Machine Learning workflows, datasets, models, training jobs, and predictions. Built with Node.js (Express), React.js, PostgreSQL, and Docker.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Prerequisites](#prerequisites)
5.  [Setup Instructions](#setup-instructions)
    *   [Local Development (without Docker)](#local-development-without-docker)
    *   [Local Development (with Docker)](#local-development-with-docker)
6.  [Running the Application](#running-the-application)
7.  [API Documentation](#api-documentation)
8.  [Testing](#testing)
9.  [CI/CD](#cicd)
10. [Deployment Guide](#deployment-guide)
11. [Additional Features](#additional-features)
12. [Future Enhancements](#future-enhancements)
13. [License](#license)

## 1. Features

*   **User Management**: Register, login, manage user profiles with role-based access (User, Admin).
*   **Dataset Management**:
    *   Upload CSV files.
    *   View detailed information including basic metadata (columns, types, row count).
    *   Delete datasets.
*   **Model Management**:
    *   Define and store metadata for ML models (algorithm, parameters, metrics).
    *   Link models to specific training jobs.
*   **Training Job Orchestration (Simulated)**:
    *   Initiate training jobs on uploaded datasets (simulated asynchronous execution).
    *   Track job status (Pending, Running, Completed, Failed).
    *   View simulated training logs and results.
*   **Prediction Management (Simulated)**:
    *   Make predictions using existing models with input data.
    *   Store prediction requests and results.
*   **Authentication & Authorization**: JWT-based authentication, bcrypt password hashing, role-based access control.
*   **Error Handling**: Centralized error middleware for robust API responses.
*   **Logging & Monitoring**: Winston-based logging for server events and request tracking.
*   **Caching**: Redis integration for frequently accessed data (e.g., dataset summaries).
*   **Rate Limiting**: Protects API endpoints from abuse.
*   **File Uploads**: Secure handling of dataset files.

## 2. Architecture

The system follows a microservices-inspired, layered architecture with a clear separation of concerns:

*   **Client (Frontend)**: A React.js single-page application (SPA) providing the user interface. It communicates with the backend via RESTful API calls.
*   **Server (Backend)**: A Node.js (Express) application exposing RESTful API endpoints. It handles business logic, data persistence, authentication, and orchestrates ML-related tasks (simulated).
*   **Database**: PostgreSQL for persistent storage of user, dataset, model, job, and prediction metadata.
*   **Cache**: Redis for in-memory data caching to improve performance.
*   **ML Engine (Simulated)**: For demonstration, actual ML training and prediction are simulated within the Node.js backend using `setTimeout`. In a real production environment, this would be an external Python microservice (e.g., Flask, FastAPI) or a dedicated ML platform (Kubeflow, SageMaker) that the Node.js backend communicates with.

```mermaid
graph TD
    A[User Browser] -->|HTTP/HTTPS| B(Nginx/Frontend)
    B -->|API Calls| C(Express Backend API)
    C -->|ORM Queries| D(PostgreSQL Database)
    C -->|Cache Operations| E(Redis Cache)
    C -->|File Storage| F(Local File System / S3)
    C -- Simulation of ML Operations --> G(Python ML Service - Optional/Future)
```

## 3. Technology Stack

*   **Frontend**: React.js, Ant Design (UI Library), Axios
*   **Backend**: Node.js, Express.js, Prisma (ORM), JWT, bcryptjs, Multer, Winston, Express-rate-limit, Cors, Helmet
*   **Database**: PostgreSQL
*   **Cache**: Redis
*   **Containerization**: Docker, Docker Compose
*   **Testing**: Jest, Supertest, React Testing Library
*   **CI/CD**: GitHub Actions
*   **Utilities**: `dotenv`, `nanoid`, `js-cookie`, `dayjs`

## 4. Prerequisites

Before you begin, ensure you have the following installed on your machine:

*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   Docker & Docker Compose (if using Docker setup)
*   Git

## 5. Setup Instructions

You can set up the project either for local development without Docker (requires local PostgreSQL & Redis) or with Docker.

### Local Development (without Docker)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system
    ```

2.  **Database Setup (PostgreSQL):**
    *   Ensure you have a PostgreSQL server running locally (e.g., via `brew services start postgresql` on macOS, or a Docker container).
    *   Create a new database named `ml_utilities`.
    *   Make sure you have a user with appropriate permissions (e.g., `user` with password `password`).
    *   Note down your database connection string.

3.  **Cache Setup (Redis):**
    *   Ensure you have a Redis server running locally (e.g., `brew services start redis` on macOS, or a Docker container).

4.  **Backend Setup:**
    ```bash
    cd server
    cp .env.example .env.development # Or .env.production
    # Edit .env.development with your actual PostgreSQL and Redis URLs
    # Example:
    # DATABASE_URL="postgresql://user:password@localhost:5432/ml_utilities?schema=public"
    # REDIS_URL="redis://localhost:6379"
    # JWT_SECRET=your_secret_key
    # ORIGIN=http://localhost:3000
    npm install
    npx prisma migrate dev --name init # Apply database migrations
    npm run db:seed # Seed initial data (admin/user accounts, dummy ML data)
    ```

5.  **Frontend Setup:**
    ```bash
    cd ../client
    cp .env.example .env.development
    # Edit .env.development if your backend is not on http://localhost:5000/api
    # Example:
    # REACT_APP_API_BASE_URL=http://localhost:5000/api
    npm install
    ```

### Local Development (with Docker)

This is the recommended setup as it provides a consistent environment.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system
    ```

2.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    # Edit .env to set your JWT_SECRET and other sensitive variables.
    # The database and redis URLs are pre-configured for Docker Compose.
    ```

3.  **Build and run Docker containers:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the `backend` and `frontend` Docker images.
    *   Start `db` (PostgreSQL), `redis`, `backend`, and `frontend` services.
    *   The backend container will automatically run Prisma migrations on startup.
    *   You might want to manually run `docker exec -it ml-utilities-backend npm run db:seed` after `docker-compose up` to seed initial data.

## 6. Running the Application

*   **If running locally (without Docker):**
    *   Start the backend:
        ```bash
        cd server
        npm run dev # or npm start for production mode
        ```
    *   Start the frontend:
        ```bash
        cd client
        npm start
        ```
    *   The frontend will be accessible at `http://localhost:3000`.
    *   The backend API will be accessible at `http://localhost:5000/api`.

*   **If running with Docker Compose:**
    *   The frontend will be accessible at `http://localhost:80` (or just `http://localhost`).
    *   The backend API will be accessible at `http://localhost:5000/api`.

**Default Credentials (after seeding):**

*   **Admin:**
    *   Email: `admin@example.com`
    *   Password: `password123`
*   **User:**
    *   Email: `user@example.com`
    *   Password: `password123`

## 7. API Documentation

The backend exposes a RESTful API. Below is a simplified overview. For a full, interactive API documentation (e.g., Swagger/OpenAPI), it would be generated from JSDoc comments or a separate specification file.

**Authentication**

*   `POST /api/auth/register` - Register a new user.
    *   Body: `{ username, email, password, [role] }`
*   `POST /api/auth/login` - Authenticate user and get JWT token.
    *   Body: `{ email, password }`
*   `GET /api/auth/profile` - Get current user's profile (requires authentication).
    *   Headers: `Authorization: Bearer <token>`

**User Management (Admin only)**

*   `GET /api/users` - Get all users.
*   `GET /api/users/:id` - Get user by ID.
*   `PUT /api/users/:id` - Update user details.
*   `DELETE /api/users/:id` - Delete user.

**Dataset Management**

*   `POST /api/datasets` - Upload a new dataset (CSV only).
    *   Headers: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
    *   Form Data: `file` (the CSV file)
*   `GET /api/datasets` - Get all datasets uploaded by the current user.
*   `GET /api/datasets/:id` - Get a specific dataset by ID.
*   `DELETE /api/datasets/:id` - Delete a dataset and its file.

**Model Management**

*   `POST /api/models` - Create a new model definition (metadata).
*   `GET /api/models` - Get all models.
*   `GET /api/models/:id` - Get a specific model by ID.
*   `PUT /api/models/:id` - Update model metadata.
*   `DELETE /api/models/:id` - Delete a model.

**Training Job Management (Simulated)**

*   `POST /api/training-jobs` - Initiate a new training job.
    *   Body: `{ name, datasetId, algorithm, parameters }`
*   `GET /api/training-jobs` - Get all training jobs.
*   `GET /api/training-jobs/:id` - Get a specific training job by ID (includes status, logs, results).

**Prediction Management (Simulated)**

*   `POST /api/models/:modelId/predict` - Make a prediction using a specified model.
    *   Body: `{ inputData: { /* your input features */ } }`
*   `GET /api/predictions` - Get all predictions made by the current user.
*   `GET /api/predictions/:id` - Get a specific prediction result.

**Health Check**

*   `GET /health` - Returns server status.

## 8. Testing

The project includes comprehensive tests for both backend and frontend.

*   **Backend Tests (Jest & Supertest)**:
    *   **Unit Tests**: For individual functions and services.
    *   **Integration Tests**: For API endpoints and their interaction with the database.
    *   **API Tests**: Using `Supertest` to simulate HTTP requests.
    *   To run backend tests:
        ```bash
        cd server
        npm test
        # For coverage report:
        npm run test:coverage
        ```

*   **Frontend Tests (Jest & React Testing Library)**:
    *   **Unit Tests**: For React components, hooks, and utility functions.
    *   To run frontend tests:
        ```bash
        cd client
        npm test
        # React scripts test defaults to watch mode. For a single run with coverage:
        # npm test -- --coverage --watchAll=false
        ```

## 9. CI/CD

The project is configured with GitHub Actions for Continuous Integration (CI) and a placeholder for Continuous Deployment (CD).

*   **CI (`.github/workflows/ci.yml`)**:
    *   Triggers on `push` and `pull_request` events to `main` and `develop` branches.
    *   Runs separate jobs for backend tests (including database setup), frontend tests, and Docker image builds.
    *   Ensures code quality and functionality before merging.
*   **CD (`.github/workflows/cd.yml`)**:
    *   Triggers on `push` to the `main` branch.
    *   Depends on successful completion of CI jobs.
    *   Logs into GitHub Container Registry, builds and pushes Docker images (backend & frontend).
    *   Includes a placeholder SSH deployment step to a production server (requires `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, and `GHCR_TOKEN` secrets to be configured in GitHub repository settings). This step demonstrates how to pull the latest images and restart services on a remote server.

## 10. Deployment Guide

The recommended deployment strategy involves Docker and Docker Compose (or Kubernetes for larger scale).

1.  **Prepare Production Environment**:
    *   A Linux server (e.g., Ubuntu LTS)
    *   Docker and Docker Compose installed
    *   Nginx (if not using the Nginx Docker image for frontend)
    *   Required firewall rules (e.g., allow 80/443 for web, 22 for SSH)

2.  **Server Configuration**:
    *   Create a dedicated directory for your application on the server.
    *   Copy the `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend`, `nginx/nginx.conf`, and `.env` files to this directory.
    *   **Crucially**: Create a production-specific `.env` file (`.env.production` or simply `.env` if it's the only one). This should contain strong, unique secrets for `JWT_SECRET`, actual database credentials, and potentially `REDIS_URL` if Redis is hosted separately.
    *   Ensure persistence for `uploads` and `logs` directories by mounting them as volumes, as shown in `docker-compose.yml`.

3.  **Database (Production)**:
    *   It's generally recommended to use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL) in production rather than a Docker container on the same host, for better reliability, backups, and scalability. Update `DATABASE_URL` in `.env` accordingly.

4.  **Redis (Production)**:
    *   Similarly, consider a managed Redis service or a dedicated Redis instance for production. Update `REDIS_URL` in `.env`.

5.  **Run Migrations & Seed Data**:
    *   On your server, navigate to the application directory.
    *   Ensure the `DATABASE_URL` in `.env` is correct.
    *   Run initial migrations: `docker-compose run backend npx prisma migrate deploy`
    *   Run seed data (optional, or adapt for production data): `docker-compose run backend npm run db:seed`

6.  **Start the Application**:
    ```bash
    docker-compose -f docker-compose.yml up --build -d
    ```
    This will pull/build images and start all services. For production, you might create a `docker-compose.prod.yml` with more robust configurations (e.g., `restart: unless-stopped`, network setups, resource limits).

7.  **HTTPS (Recommended for Production)**:
    *   Configure an external Nginx proxy (if not using the Nginx Docker image for frontend) or your cloud provider's load balancer to handle SSL termination using Let's Encrypt or your preferred certificate authority. Redirect all HTTP traffic to HTTPS.

## 11. Additional Features

*   **Authentication/Authorization**: Implemented with JWT for stateless authentication and role-based authorization middleware (`USER`, `ADMIN`).
*   **Logging**: `Winston` is used for structured logging on the backend, with logs directed to console and files.
*   **Error Handling Middleware**: A centralized error handling middleware catches `AppError` instances and other exceptions, providing consistent API error responses.
*   **Caching Layer**: `Redis` is integrated to cache frequently accessed data (e.g., dataset metadata summaries) to reduce database load and improve response times.
*   **Rate Limiting**: `express-rate-limit` is used to prevent abuse of API endpoints by limiting the number of requests per IP address within a time window.
*   **Performance Monitoring**: While not fully integrated, the system is structured to allow integration with tools like Prometheus/Grafana (for metrics) or Sentry (for error tracking). Request durations are logged.
*   **File Upload Security**: `Multer` is configured for file uploads, with considerations for file type and size limits (can be extended). Files are stored on the local filesystem, but in production, cloud storage like AWS S3 or Google Cloud Storage would be preferred.

## 12. Future Enhancements

*   **Real ML Integration**: Replace simulated ML operations with actual Python microservices (e.g., Flask/FastAPI) that perform model training, evaluation, and prediction using libraries like Scikit-learn, TensorFlow, or PyTorch.
*   **Advanced Data Processing**: Implement more sophisticated data preprocessing capabilities (e.g., missing value imputation, feature scaling, encoding categorical variables) and data visualization within the UI.
*   **Interactive Data Exploration**: Integrate libraries like Plotly.js or D3.js for interactive charts and graphs to visualize dataset distributions and model performance.
*   **Model Versioning & Experiment Tracking**: Implement robust systems for tracking different versions of models and experiments (e.g., using MLflow).
*   **Hyperparameter Tuning**: Provide options for automated hyperparameter optimization.
*   **Scalable Storage**: Migrate file storage from local filesystem to cloud object storage (AWS S3, Google Cloud Storage) for better scalability and resilience.
*   **Asynchronous Job Queue**: Use a message queue (RabbitMQ, Kafka, SQS) and a worker service (Celery in Python, BullMQ in Node.js) for truly asynchronous and scalable training/prediction jobs.
*   **Frontend UI/UX**: Further refine the user interface and user experience, add more rich features for data exploration and model insights.
*   **Notifications**: Implement real-time notifications for job completion, errors, etc., using WebSockets.
*   **Multi-tenancy**: If required, enhance the system to support multiple independent organizations/tenants.

## 13. License

This project is licensed under the MIT License - see the `LICENSE` file for details.
(Note: A `LICENSE` file would be present in a real project.)