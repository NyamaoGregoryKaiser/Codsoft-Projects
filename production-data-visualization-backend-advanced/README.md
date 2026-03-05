# DataViz Pro: Comprehensive Data Visualization Tools System

DataViz Pro is an enterprise-grade, full-stack web application designed for creating, managing, and visualizing data through interactive dashboards and charts. Built with Node.js (Express) for the backend and React (Chakra UI) for the frontend, it provides a robust platform for business intelligence and data insights.

## Features

*   **User Authentication & Authorization:** Secure JWT-based login, registration, and role-based access control (User, Admin).
*   **Data Source Management:** Connect to various data sources (mock data, CSV upload, API endpoints, database queries - mock data fully implemented for demo).
*   **Chart Builder:** Create interactive charts (bar, line, pie, etc.) using Echarts, configuring data mappings and visual properties.
*   **Dashboard Builder:** Design dynamic dashboards with a drag-and-drop grid layout, combining multiple charts.
*   **CRUD Operations:** Full Create, Read, Update, Delete functionality for Users, Data Sources, Charts, and Dashboards.
*   **Performance & Security:**
    *   **Caching:** In-memory caching for API responses.
    *   **Rate Limiting:** Protects API endpoints from abuse.
    *   **Error Handling:** Centralized error handling middleware.
    *   **Logging:** Winston for structured logging.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **CI/CD Ready:** GitHub Actions configurations for automated testing and deployment.
*   **Comprehensive Testing:** Unit and Integration tests for both frontend and backend.
*   **Documentation:** Detailed README, API, Architecture, and Deployment guides.

## Technology Stack

*   **Frontend:** React, Chakra UI, React Router DOM, Axios, Echarts, React Grid Layout
*   **Backend:** Node.js, Express.js, Sequelize (ORM)
*   **Database:** PostgreSQL
*   **Authentication:** JSON Web Tokens (JWT), bcryptjs
*   **Testing:** Jest, React Testing Library, Supertest
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Logging:** Winston
*   **Caching:** node-cache
*   **Rate Limiting:** express-rate-limit

## Setup and Installation

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   Docker and Docker Compose (v2 or higher)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/data-viz-system.git
cd data-viz-system
```

### 2. Environment Configuration

Create `.env` files for both the backend and frontend.

**`data-viz-system/.env`** (for Docker Compose services)
```dotenv
# Docker Compose .env for shared configuration
# Backend
PORT=5000
JWT_SECRET=supersecretjwtkey
JWT_EXPIRATION=1d
FRONTEND_URL=http://localhost:3000

# Database
DB_NAME=dataviz
DB_USER=datavizuser
DB_PASSWORD=password
DB_HOST=db # 'db' is the service name in docker-compose
DB_PORT=5432

# Cache
CACHE_TTL_SECONDS=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Frontend
REACT_APP_API_BASE_URL=http://localhost:5000/api # Direct hit to backend dev server
# For production (with Nginx proxy), this would be REACT_APP_API_BASE_URL=/api
```
*Note: Make sure to copy this to `data-viz-system/.env` in the root directory.*

### 3. Run with Docker Compose (Recommended for Development)

This will set up PostgreSQL, the Node.js backend, and the React frontend in isolated containers.

```bash
docker compose up --build -d
```

*   `--build`: Rebuilds the images (useful when code changes).
*   `-d`: Runs containers in detached mode.

The `docker-compose.yml` is configured to run `npm install`, database migrations, and seed the database upon starting the backend service. It also starts the backend with `nodemon` for live reloading and the frontend with `react-scripts start`.

Once started:
*   **Backend API:** `http://localhost:5000/api`
*   **Frontend Application:** `http://localhost:3000`

**Initial Credentials (from seed data):**
*   **Admin User:**
    *   Email: `admin@example.com`
    *   Password: `admin123`
*   **Regular User:**
    *   Email: `user@example.com`
    *   Password: `user123`

### 4. Run Manually (Alternative for Development)

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env # Edit .env for DB_HOST=localhost
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npm run seed # Seeds initial data (users, datasources, charts, dashboards)
npm run dev
```
The backend will be running on `http://localhost:5000`.

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env # Edit .env for REACT_APP_API_BASE_URL=http://localhost:5000/api
npm start
```
The frontend will be running on `http://localhost:3000`.

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Available Scripts

### Backend (`backend/package.json`)

*   `npm start`: Starts the server (production mode).
*   `npm run dev`: Starts the server with `nodemon` for development.
*   `npm test`: Runs Jest tests with coverage.
*   `npm run seed`: Runs database seeders.
*   `npm run migrate`: Runs pending database migrations.
*   `npm run migrate:undo`: Undoes the last migration.
*   `npm run db:create`: Creates the database.
*   `npm run db:drop`: Drops the database.

### Frontend (`frontend/package.json`)

*   `npm start`: Starts the development server.
*   `npm run build`: Builds the app for production to the `build` folder.
*   `npm test`: Runs Jest and React Testing Library tests.

## Further Documentation

*   [API Documentation](./docs/API.md)
*   [Architecture Documentation](./docs/ARCHITECTURE.md)
*   [Deployment Guide](./docs/DEPLOYMENT.md)

---