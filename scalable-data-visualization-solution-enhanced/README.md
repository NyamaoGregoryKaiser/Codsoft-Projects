# Data Visualization System

## Project Overview

The Data Visualization System is a comprehensive, full-stack web application designed to empower users to transform raw data into insightful visualizations and interactive dashboards. Built with TypeScript across the entire stack (Node.js/Express for the backend and React for the frontend), this system provides a robust, scalable, and secure platform for data exploration and presentation.

### Key Features:

*   **User Management:** Secure user registration and login with JWT-based authentication. Role-based authorization ensures appropriate access levels.
*   **Dataset Management:** Upload, store, and manage various datasets (e.g., CSV, JSON).
*   **Visualization Builder:** Create diverse chart types (bar, line, pie, etc.) from uploaded datasets with configurable options.
*   **Dashboard Editor:** Drag-and-drop interface to compose interactive dashboards using created visualizations.
*   **Robust Backend:**
    *   **API:** Full CRUD operations for users, datasets, visualizations, and dashboards.
    *   **Security:** Authentication (JWT), Authorization (RBAC), Rate Limiting.
    *   **Observability:** Comprehensive logging (Winston), custom error handling.
    *   **Performance:** Caching layer for frequently accessed data.
    *   **Database:** PostgreSQL with TypeORM for robust data persistence and migrations.
*   **Interactive Frontend:**
    *   Intuitive UI/UX for managing data, building visualizations, and designing dashboards.
    *   React with Context API for state management.
    *   `react-chartjs-2` for rendering dynamic charts.
*   **Developer Experience:**
    *   Dockerized environment for easy setup and development.
    *   Comprehensive testing suite (Unit, Integration, API, UI).
    *   CI/CD pipeline configuration (GitHub Actions example).
    *   Detailed documentation (README, Architecture, API, Deployment).

## Technology Stack

### Backend:
*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Authentication:** JSON Web Tokens (JWT), Bcrypt
*   **Logging:** Winston
*   **Caching:** Node-cache
*   **Rate Limiting:** Express-rate-limit
*   **Testing:** Jest, Supertest

### Frontend:
*   **Language:** TypeScript
*   **Library:** React.js
*   **Routing:** React Router DOM
*   **State Management:** React Context API
*   **Styling:** Tailwind CSS (or similar, for simplicity here, basic CSS)
*   **Charting:** `react-chartjs-2` (Chart.js wrapper)
*   **HTTP Client:** Axios
*   **Testing:** Jest, React Testing Library

### Infrastructure & Tools:
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions
*   **Version Control:** Git

## Setup and Installation

### Prerequisites

Make sure you have the following installed:
*   Node.js (LTS version, e.g., v18 or v20)
*   npm or Yarn
*   Docker and Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/your-username/data-viz-system.git
cd data-viz-system
```

### 2. Environment Variables

Create `.env` files based on the provided examples.

#### `server/.env`
```dotenv
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@db:5432/data_viz_db
JWT_SECRET=your_jwt_secret_key_here # Use a strong, random key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_secret_key_here # Use a strong, random key
REFRESH_TOKEN_EXPIRES_IN=7d
ENABLE_CACHE=true
CACHE_TTL=3600 # seconds
RATE_LIMIT_WINDOW=60 # seconds
RATE_LIMIT_MAX_REQUESTS=100
```

#### `client/.env.development`
```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### 3. Docker Setup (Recommended for Development)

Using Docker Compose will set up PostgreSQL, the backend server, and the frontend client.

```bash
docker-compose up --build -d
```

This command will:
*   Build Docker images for the server and client.
*   Create and start a PostgreSQL container (`db`).
*   Start the backend server container (`server`).
*   Start the frontend client container (`client`).

Once containers are up:
*   Backend API will be available at `http://localhost:5000/api`
*   Frontend application will be available at `http://localhost:3000`

### 4. Manual Setup (Alternative to Docker Compose)

#### Backend Setup

```bash
cd server
npm install # or yarn install
npm run typeorm migration:run # Run migrations
npm run seed # (Optional) Seed initial data
npm run dev # Start development server (with ts-node-dev)
```

The backend server will run on `http://localhost:5000`.

#### Frontend Setup

```bash
cd client
npm install # or yarn install
npm start # Start development server
```

The frontend application will run on `http://localhost:3000`.

## Running Tests

### Backend Tests

```bash
cd server
npm test
```
This will run unit, integration, and API tests using Jest and Supertest.

### Frontend Tests

```bash
cd client
npm test
```
This will run unit and component tests using Jest and React Testing Library.

## API Documentation

Refer to `API_DOCS.md` for detailed information on available API endpoints, request/response formats, and authentication requirements.

## Architecture Documentation

Refer to `ARCHITECTURE.md` for a high-level overview of the system's design, component interactions, and technical decisions.

## Deployment Guide

Refer to `DEPLOYMENT.md` for instructions on deploying the application to a production environment.

---