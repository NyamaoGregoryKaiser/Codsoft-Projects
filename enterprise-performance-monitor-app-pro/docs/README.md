# PerfMon: Web Performance Monitoring System

PerfMon is a comprehensive, production-ready full-stack web application designed to help developers monitor the performance of their web applications in real-time. It allows users to register their applications, track key front-end performance metrics (Core Web Vitals like FCP, LCP, CLS, TTFB, and custom events), and visualize this data through an intuitive dashboard.

## Features

**Core Application:**
*   **User Management**: Register, login, manage user profiles.
*   **Application Management**: CRUD operations for monitored web applications.
*   **Page Management**: Define and manage specific pages/routes within an application to track granular performance.
*   **Performance Data Ingestion**: A robust API endpoint to receive performance metrics from client-side JavaScript snippets.
*   **Reporting & Analytics**: Dashboards to visualize performance trends, averages, and breakdowns by browser, OS, and device type.
*   **Client-Side Snippet Generator**: Easily generate a JavaScript snippet to embed in your web application for data collection.

**Database Layer:**
*   PostgreSQL for reliable and scalable data storage.
*   TypeORM for efficient object-relational mapping in TypeScript.
*   Schema definitions for Users, Applications, Pages, and Performance Metrics.
*   Migration scripts for version-controlled database schema changes.
*   Seed data for initial setup (e.g., admin user).
*   Optimized queries with strategic indexing for performance data aggregation.

**Configuration & Setup:**
*   `package.json` with all necessary Node.js/React dependencies.
*   Comprehensive environment configuration (`.env` support).
*   Docker setup for containerized development and deployment.
*   Conceptual CI/CD pipeline using GitHub Actions.

**Testing & Quality:**
*   Unit tests (Backend services, utilities; Frontend components, hooks).
*   Integration tests (Backend API interactions with a test database).
*   API tests (Supertest for backend endpoints).
*   Conceptual Performance tests (k6 for load testing, Lighthouse CI for frontend).

**Additional Features:**
*   **Authentication/Authorization**: JWT-based authentication for users, API Key authentication for performance data ingestion. Role-based authorization.
*   **Logging**: Structured logging with Winston for requests, errors, and key events.
*   **Error Handling**: Centralized error handling middleware.
*   **Caching Layer**: In-memory caching for frequently accessed report data to improve response times.
*   **Rate Limiting**: Protect API endpoints from abuse, with specific limits for performance data ingestion.

## Technologies Used

*   **Backend**: Node.js, Express.js, TypeScript, TypeORM, PostgreSQL, JWT, Bcrypt, Winston, Node-cache, Express-rate-limit.
*   **Frontend**: React, TypeScript, React Router DOM, Axios, Tailwind CSS, Recharts, Day.js.
*   **Tooling**: Docker, Jest, Supertest.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v9 or higher)
*   Docker & Docker Compose (for containerized setup)
*   Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/perfmon.git
cd perfmon
```

### 2. Environment Configuration

Create a `.env` file in the root of the `perfmon/` directory (next to `docker-compose.yml`) and populate it using the `.env.example` provided:

```bash
cp .env.example .env
```
Edit `.env` to customize values if needed. Ensure `JWT_SECRET` and `API_KEY_SECRET` are strong, unique values for production.

### 3. Run with Docker Compose (Recommended)

This will set up the PostgreSQL database, backend, and frontend services.

```bash
docker-compose up --build
```

This command will:
*   Build Docker images for the backend and frontend.
*   Start the PostgreSQL container.
*   Wait for the PostgreSQL database to be healthy.
*   Run database migrations on the backend.
*   Start the backend service (on port 5000).
*   Start the frontend service (on port 3000, served by Nginx).

Once all services are up:
*   Frontend will be accessible at `http://localhost:3000`
*   Backend API will be accessible at `http://localhost:5000/api`

**Note:** The first time `npm run migrate:run` is executed, it will create the database schema. Subsequent `docker-compose up` calls will not re-run existing migrations unless new ones are added.

### 4. Manual Setup (Alternative for Development)

#### Backend Setup (`backend/`)

```bash
cd backend
npm install
cp .env.example .env # Create .env for backend, ensure it matches docker-compose.yml for DB
# Update DB_HOST to 'localhost' if running PostgreSQL directly or in a separate Docker container
# DB_HOST=localhost

# Run migrations (ensure PostgreSQL is running and accessible)
npm run migrate:run

# (Optional) Run seeders
npm run seed:run

# Start development server
npm run dev
```
The backend will run on `http://localhost:5000`.

#### Frontend Setup (`frontend/`)

```bash
cd frontend
npm install

# Start development server
npm start
```
The frontend will run on `http://localhost:3000`. Make sure `REACT_APP_API_BASE_URL` in `frontend/.env` (create if not exists) points to your backend: `REACT_APP_API_BASE_URL=http://localhost:5000/api`.

## Usage

1.  **Register/Login**: Navigate to `http://localhost:3000` and register a new user.
2.  **Create Application**: After logging in, go to the dashboard and create a new application. **Important**: Copy the `API Key` displayed after creation. This key is crucial for sending performance data.
3.  **Embed Snippet**: Click "View & Copy Snippet" for your application. Paste the generated JavaScript snippet just before the closing `</head>` tag of the web application you want to monitor.
4.  **Monitor Performance**: As your monitored application receives traffic, performance data will be sent to PerfMon. View dashboards for your applications and individual pages to see trends, averages, and breakdowns.
5.  **Define Pages**: Optionally, define specific pages (e.g., "Product Page", "Checkout Flow") with regular expressions (`pathRegex`) to group metrics for different URL patterns.

## Testing

To run tests:

#### Backend Tests
```bash
cd backend
npm test
# For coverage report: npm test -- --coverage
```

#### Frontend Tests (React Testing Library)
```bash
cd frontend
npm test
```
*Note: For performance tests (k6, Lighthouse CI), you would set up separate test environments or integrate them into your CI/CD pipeline as described in the CI/CD section.*

## Documentation

*   [API Documentation](./API_DOCUMENTATION.md)
*   [Architecture Documentation](./ARCHITECTURE.md)
*   [Deployment Guide](./DEPLOYMENT.md)

---