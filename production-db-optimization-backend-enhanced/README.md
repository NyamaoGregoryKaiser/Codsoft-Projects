# Database Optimization Management System (DOMS)

## Project Overview

The Database Optimization Management System (DOMS) is a full-stack, enterprise-grade web application designed to help teams manage and track database optimization efforts. It provides functionalities to register target databases, create and manage analysis reports (e.g., slow query reports), and generate, track, and prioritize recommendations for database improvements (e.g., adding indexes, query refactoring).

**Key Features:**

*   **User Management & Authentication:** Secure JWT-based authentication with role-based authorization (Admin/User).
*   **Target Database Management:** Register and track various databases (PostgreSQL, MySQL, MongoDB, etc.) targeted for optimization.
*   **Analysis Report Management:** Create, view, and update reports detailing database performance issues, including hypothetical slow query data.
*   **Recommendation Tracking:** Generate and manage optimization recommendations linked to analysis reports and target databases. Track status (Pending, Approved, Implemented, Dismissed) and priority.
*   **Caching:** Redis integration for frequently accessed data to improve API response times.
*   **Logging:** Centralized Winston-based logging for application events and errors.
*   **Error Handling:** Robust middleware for consistent error responses.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **CI/CD:** GitHub Actions workflow for automated testing and deployment.
*   **Comprehensive Testing:** Unit, integration, and API tests for backend; unit and integration tests for frontend.

## Technology Stack

*   **Backend:** Node.js (Express.js), TypeScript
*   **Frontend:** React, TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JSON Web Tokens (JWT)
*   **Caching:** Redis
*   **Logging:** Winston
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Testing:** Jest, Supertest, React Testing Library
*   **Styling:** Minimal CSS (can be extended with a framework like Tailwind CSS, Bootstrap, etc.)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have met the following requirements:

*   Node.js (v18 or higher) and npm (or yarn)
*   Docker and Docker Compose
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/doms.git # Replace with actual repo URL
cd doms
```

### 2. Environment Configuration

Create `.env` files for both the `backend` and `frontend` directories based on their `.env.example` counterparts.

#### `backend/.env`
```dotenv
NODE_ENV=development
PORT=5000

# Database (Ensure this matches your docker-compose setup)
DATABASE_URL="postgresql://user:password@db:5432/doms_db?schema=public"

# JWT
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRES_IN=1d

# Redis (Ensure this matches your docker-compose setup)
REDIS_URL=redis://redis:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```
**Note:** For local development, `DATABASE_URL` and `REDIS_URL` should point to the Docker service names (`db` and `redis`).

#### `frontend/.env`
```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Start Services with Docker Compose

Navigate to the root directory of the project and run:

```bash
docker-compose up --build -d
```
This command will:
*   Build the Docker images for the backend and frontend.
*   Start the PostgreSQL database (`db`) and Redis cache (`redis`) containers.
*   Start the backend (`backend`) and frontend (`frontend`) containers.
*   Run Prisma migrations on the backend startup.

It might take a few moments for all services to become healthy. You can check their status with `docker-compose ps`.

### 4. Seed the Database

After the `backend` service is up and running, you'll need to seed it with initial data (like an admin user and some sample records).

```bash
# Exec into the backend container
docker-compose exec backend npm run prisma:seed
```
This will create:
*   An admin user: `admin@example.com` / `adminpassword`
*   A regular user: `user@example.com` / `userpassword`
*   Sample Target Databases, Analysis Reports, and Recommendations.

### 5. Access the Application

*   **Frontend:** Open your browser and go to `http://localhost:3000`
*   **Backend API:** The API will be accessible at `http://localhost:5000/api/v1`

You can log in using the seeded credentials.

### Useful Docker Commands

*   `docker-compose up`: Start all services (use `--build` to rebuild images).
*   `docker-compose down`: Stop and remove all services, networks, and volumes.
*   `docker-compose stop [service_name]`: Stop a specific service.
*   `docker-compose start [service_name]`: Start a stopped service.
*   `docker-compose ps`: List all services and their status.
*   `docker-compose logs -f [service_name]`: View logs for a specific service.
*   `docker-compose exec [service_name] [command]`: Run a command inside a service container.

## Development

If you prefer to run frontend/backend separately without Docker for development:

### Backend Development

1.  **Start DB/Redis (using Docker Compose)**:
    ```bash
    docker-compose up -d db redis
    ```
2.  **Install dependencies**:
    ```bash
    cd backend
    npm install
    ```
3.  **Run Prisma Migrations**:
    ```bash
    npx prisma migrate dev --name init
    ```
4.  **Seed data**:
    ```bash
    npm run prisma:seed
    ```
5.  **Start the backend in development mode**:
    ```bash
    npm run dev
    ```
    The backend will run on `http://localhost:5000`.

### Frontend Development

1.  **Install dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Start the frontend development server**:
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

## Running Tests

### Backend Tests

Navigate to the `backend` directory and run:
```bash
npm test
```
This will run unit, integration, and API tests using Jest, including coverage reporting. The `setup.ts` file ensures a clean database state for testing by resetting and reseeding it.

### Frontend Tests

Navigate to the `frontend` directory and run:
```bash
npm test
```
This will run unit and integration tests for React components using Jest and React Testing Library.

## API Endpoints

Refer to `API_DOCS.md` for detailed API documentation.

## Linting and Formatting

### Backend
```bash
cd backend
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors
```

### Frontend
```bash
cd frontend
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors
```

---
```