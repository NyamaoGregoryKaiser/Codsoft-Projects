# 📈 Database Optimization System

A comprehensive, production-ready full-stack web application designed to help monitor, analyze, and optimize PostgreSQL database performance. This system provides insights into slow queries, suggests index improvements, identifies schema issues, and tracks key performance metrics through an intuitive web interface.

## ✨ Features

*   **User Authentication & Authorization**: Secure login/registration with JWT, role-based access control (Admin/User).
*   **Query Performance Monitoring**:
    *   Identify and list slow-running queries.
    *   View detailed query execution plans (`EXPLAIN` output).
    *   Filter queries by duration, text, and time range.
*   **Index Recommendation Engine**:
    *   Suggests new indexes based on analysis of slow queries and their execution plans.
    *   Track the status of index suggestions (pending, applied, dismissed).
*   **Schema Analysis**:
    *   Detect potential schema issues (e.g., missing foreign keys, suboptimal data types).
    *   Categorize issues by severity and track their resolution status.
*   **Database Performance Metrics**:
    *   Collect and visualize real-time and historical metrics (CPU, Memory, I/O, Connections, Transactions/Sec).
    *   Configurable time ranges for metric history.
*   **Caching Layer**: Improves API response times for frequently accessed data.
*   **Logging & Monitoring**: Comprehensive logging for backend operations and errors.
*   **Error Handling**: Centralized error handling middleware for consistent API responses.
*   **Rate Limiting**: Protects API endpoints from abuse.
*   **Dockerized Setup**: Easy deployment and environment consistency using Docker Compose.
*   **CI/CD Pipeline**: GitHub Actions for automated testing and deployment.
*   **Comprehensive Documentation**: README, API Docs, Architecture, Deployment Guide.

## 🚀 Technologies Used

**Backend (Node.js/Express)**:
*   **Framework**: Express.js
*   **ORM**: Prisma
*   **Database**: PostgreSQL
*   **Authentication**: JSON Web Tokens (JWT), bcryptjs
*   **Logging**: Winston
*   **Caching**: Node-cache
*   **Scheduling**: Node-cron
*   **Validation**: Express-async-handler, basic manual validation
*   **Security**: Helmet, CORS, Express-rate-limit

**Frontend (React.js)**:
*   **Framework**: React.js
*   **Routing**: React Router DOM
*   **State Management**: React Context API (for Auth)
*   **Styling**: Tailwind CSS, Heroicons
*   **API Client**: Axios
*   **Charts**: React-Chartjs-2, Chart.js
*   **Utilities**: Day.js (date formatting), JS-Cookie (cookie management), React-Toastify (notifications)

**DevOps & Tools**:
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions
*   **Testing**: Jest (Unit, Integration), Supertest (API), Artillery (Performance)
*   **Code Quality**: ESLint, Prettier

## 📦 Setup and Installation

### Prerequisites

*   Node.js (v18+) & npm (v8+)
*   Docker & Docker Compose
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/database-optimizer-system.git
cd database-optimizer-system
```

### 2. Environment Configuration

Create a `.env` file in the project root directory based on `.env.example`.
```bash
cp .env.example .env
```
Open `.env` and configure your database credentials and JWT secrets.
**Important**: For production, replace placeholder secrets with strong, unique values.

```ini
# .env file content (example)
POSTGRES_DB=optimizer_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password_for_dev # Change this for production

# Backend Specific
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres_password_for_dev@db:5432/optimizer_db?schema=public"
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY # MUST BE STRONG
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=ANOTHER_SUPER_SECRET_KEY # MUST BE STRONG
REFRESH_TOKEN_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info # debug, http, info, warn, error
CACHE_TTL_SECONDS=3600
COLLECTOR_SCHEDULE_CRON="*/5 * * * *" # Collector runs every 5 minutes in demo
SLOW_QUERY_THRESHOLD_MS=500

# Frontend Specific
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run with Docker Compose (Recommended)

This will build the Docker images, start the PostgreSQL database, run backend migrations and seeding, and launch both the backend and frontend services.

```bash
docker-compose up --build -d
```

*   `-d` runs the containers in detached mode.
*   `--build` ensures fresh images are built.

Wait a few minutes for all services to start and the database to be seeded.

*   **Backend API**: `http://localhost:5000/api`
*   **Frontend App**: `http://localhost:3000`

### 4. Manual Setup (Alternative, for development without Docker)

#### Backend Setup (`backend/`)

```bash
cd backend
npm install
npx prisma migrate dev --name init # Apply migrations
node seed.js # Seed initial data (admin user, mock DB instance, etc.)
npm run dev # Start backend in development mode (with nodemon)
```

#### Frontend Setup (`frontend/`)

```bash
cd frontend
npm install
npm start # Start frontend development server
```

Make sure your `backend/.env` file has `DATABASE_URL` pointing to a local PostgreSQL instance and `frontend/.env` points to your backend `REACT_APP_API_URL`.

## 🧑‍💻 Usage

1.  **Access the Frontend**: Open your browser and navigate to `http://localhost:3000`.
2.  **Login**: Use the default admin credentials (created during seeding):
    *   **Username**: `admin`
    *   **Password**: `adminpassword`
    *   *Note*: The `seed.js` script adds this user. If you re-run `seed.js` without clearing the database, it will upsert the user.
3.  **Explore**:
    *   **Dashboard**: Get an overview of critical metrics and pending optimizations.
    *   **Slow Queries**: View and analyze slow queries collected by the system. Click on a query for its full `EXPLAIN` plan.
    *   **Index Suggestions**: Review suggested indexes and mark them as applied/dismissed.
    *   **Schema Analysis**: Discover potential issues in your database schema.
    *   **Metrics**: Visualize historical performance metrics using interactive charts.

## 🧪 Testing

The project includes various types of tests:

### Backend Tests

Navigate to the `backend/` directory:

*   **Unit Tests**: `npm run test:unit` (e.g., individual service functions)
*   **Integration Tests**: `npm run test:integration` (e.g., API routes interacting with services and DB)
*   **API Tests**: `npm run test:api` (e.g., end-to-end API calls with Supertest)
*   **All Tests (with coverage)**: `npm test`

These tests require a local PostgreSQL instance running or the Docker setup with `DATABASE_URL` configured for a test database. The CI/CD pipeline sets up a temporary DB for tests.

### Frontend Tests

Navigate to the `frontend/` directory:

*   **Unit/Component Tests**: `npm test` (Uses React Testing Library and Jest)

### Performance Tests

Using Artillery to simulate load on the backend.
1.  Ensure your backend is running (e.g., via Docker Compose).
2.  Install Artillery globally: `npm install -g artillery`
3.  From the project root, run the test: `artillery run performance-test.yml`

## 📊 Code Coverage

The backend aims for 80%+ unit test coverage. Coverage reports are generated in `backend/coverage/` after running `npm test`.

## 🏗️ Architecture

Refer to `ARCHITECTURE.md` for a detailed breakdown of the system's design.

## 📄 API Documentation

Refer to `API_DOCS.md` for a complete list of backend API endpoints, request/response formats, and authentication requirements.

## 🚀 Deployment

Refer to `DEPLOYMENT.md` for instructions on deploying the application to a production environment.

## 🤝 Contributing

Contributions are welcome! Please refer to the [Contributing Guide](CONTRIBUTING.md - not provided in this response, but good practice).

## 📄 License

This project is licensed under the MIT License.