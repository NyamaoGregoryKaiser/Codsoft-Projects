```markdown
# Enterprise Performance Monitoring System

This is a full-stack, enterprise-grade performance monitoring system designed to collect, store, visualize, and alert on performance metrics from various applications.

## Table of Contents

1.  [Features](#features)
2.  [Architecture](#architecture)
3.  [Technology Stack](#technology-stack)
4.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Local Development with Docker Compose](#local-development-with-docker-compose)
    *   [Manual Setup (Backend)](#manual-setup-backend)
    *   [Manual Setup (Frontend)](#manual-setup-frontend)
5.  [Running the Application](#running-the-application)
6.  [Testing](#testing)
    *   [Unit and Integration Tests](#unit-and-integration-tests)
    *   [API Tests](#api-tests)
    *   [Performance Tests](#performance-tests)
7.  [API Documentation](#api-documentation)
8.  [Deployment](#deployment)
9.  [CI/CD](#ci-cd)
10. [Usage Example: Monitoring an Application](#usage-example-monitoring-an-application)
11. [License](#license)

## Features

*   **Core Application:** Node.js/Express backend, React frontend.
*   **User Management:** Register, login, and manage user accounts with JWT authentication.
*   **Project Management:** Register applications (projects) to be monitored, generate API keys for them.
*   **Metric Ingestion:** Robust API endpoint for monitored applications to send various performance metrics (HTTP requests, custom events, resource usage, errors).
*   **Dashboard & Visualization:** Frontend dashboard to view aggregated and time-series performance data for your projects.
*   **Alerting:** Define thresholds for metrics, trigger and manage alerts.
*   **CRUD API:** Full set of RESTful API endpoints for users, projects, metrics, and alerts.
*   **Database Layer:** PostgreSQL with Knex.js for migrations, seeding, and schema management.
*   **Configuration:** Environment-based configuration, Docker support, CI/CD pipeline setup.
*   **Testing & Quality:** Comprehensive Unit, Integration, and Performance tests.
*   **Authentication/Authorization:** JWT for user sessions, API Keys for secure metric ingestion.
*   **Logging & Monitoring:** Structured logging with Winston.
*   **Error Handling:** Centralized error handling middleware.
*   **Caching Layer:** Redis integration for API response caching and session management.
*   **Rate Limiting:** Protects API endpoints from abuse.

## Architecture

The system follows a microservices-like architecture with a clear separation of concerns:

*   **Frontend (React):** User interface for interacting with the monitoring system (dashboard, project management, alerts).
*   **Backend (Node.js/Express):** RESTful API serving the frontend and providing ingestion endpoints for monitored applications.
    *   **Controllers:** Handle incoming requests, call services.
    *   **Services:** Implement business logic.
    *   **Repositories:** Abstract database interactions.
    *   **Middleware:** Authentication, authorization, logging, error handling, rate limiting, caching.
*   **Database (PostgreSQL):** Primary data store for users, projects, metric metadata, and aggregated performance data. Optimized for time-series queries.
*   **Cache (Redis):** Used for session management, API rate limiting, and caching frequently accessed data.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for a more detailed diagram and explanation.

## Technology Stack

**Backend:**
*   Node.js
*   Express.js
*   PostgreSQL (Database)
*   Redis (Cache, Rate Limiting Store)
*   Knex.js (ORM/Query Builder, Migrations)
*   JWT (Authentication)
*   Bcrypt (Password Hashing)
*   Winston (Logging)
*   Joi (Validation)
*   Express-rate-limit
*   Connect-redis (Session Store)
*   Node-cache-manager-redis-store

**Frontend:**
*   React.js
*   React Router DOM
*   Axios (HTTP Client)
*   Chart.js / React-chartjs-2 (Data Visualization)
*   Tailwind CSS (Styling - *conceptual, not fully implemented for brevity but assumed for enterprise UI*)

**DevOps & Testing:**
*   Docker / Docker Compose
*   GitHub Actions (CI/CD)
*   Jest (Unit/Integration Testing)
*   Supertest (API Testing)
*   K6 (Performance Testing)

## Setup and Installation

### Prerequisites

*   Git
*   Node.js (LTS recommended)
*   npm or yarn
*   Docker and Docker Compose (recommended for local development)
*   PostgreSQL (if not using Docker)
*   Redis (if not using Docker)

### Local Development with Docker Compose (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/performance-monitoring-system.git
    cd performance-monitoring-system
    ```

2.  **Create `.env` files:**
    Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    Review and update environment variables as needed. Defaults should work for local setup.

3.  **Build and run services with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build Docker images for the backend and frontend.
    *   Start PostgreSQL, Redis, backend, and frontend containers.
    *   Run backend database migrations and seeds automatically (via the `Dockerfile` and `start.sh` script).

4.  **Access the application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000`

### Manual Setup (Backend)

If you prefer to run the backend without Docker:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    ```
    Configure your PostgreSQL and Redis connection details in `.env`.

4.  **Setup Database:**
    Ensure PostgreSQL and Redis servers are running.
    Run migrations:
    ```bash
    npm run migrate
    ```
    Run seeds (optional, for initial data):
    ```bash
    npm run seed
    ```

5.  **Start the backend server:**
    ```bash
    npm start
    ```
    The backend will be running at `http://localhost:5000`.

### Manual Setup (Frontend)

If you prefer to run the frontend without Docker:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Create `.env` file:**
    ```bash
    cp .env.example .env
    ```
    Ensure `REACT_APP_API_BASE_URL` points to your backend (e.g., `http://localhost:5000`).

4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will be running at `http://localhost:3000`.

## Running the Application

After successful setup (preferably with Docker Compose), navigate your browser to `http://localhost:3000`.

1.  **Register:** Create a new user account.
2.  **Login:** Use your newly created credentials.
3.  **Create Project:** Register a new application you wish to monitor. An API Key will be generated for it.
4.  **Ingest Metrics:** Use the generated API Key to send metrics from your target application to `/api/v1/metrics/ingest`.
5.  **View Dashboard:** See your project's performance data visualized.
6.  **Configure Alerts:** Set up alert rules based on metric thresholds.

## Testing

### Unit and Integration Tests

Tests are written using Jest and Supertest.

**Run all tests (backend):**
```bash
cd backend
npm test
```

**Run unit tests (backend):**
```bash
cd backend
npm run test:unit
```

**Run integration tests (backend):**
```bash
cd backend
npm run test:integration
```

**Run frontend tests:**
```bash
cd frontend
npm test
```

### API Tests

A conceptual Postman collection is described in `docs/API.md`. You can import this into Postman or Insomnia to test the API endpoints directly.

### Performance Tests

Performance tests are written using K6.

1.  **Install K6:** Follow instructions on [k6.io](https://k6.io/docs/getting-started/installation/).
2.  **Run the test:**
    ```bash
    k6 run k6-performance-test.js
    ```
    This script simulates concurrent users sending metric data to the ingest endpoint and querying data.

## API Documentation

Detailed API documentation, including endpoints, request/response formats, and authentication methods, can be found in [docs/API.md](docs/API.md).

## Deployment

A guide for deploying this application in a production environment (e.g., using Docker Swarm or Kubernetes) is available in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## CI/CD

A basic GitHub Actions workflow configuration is provided in `.github/workflows/ci.yml`. This workflow automates:
*   Linting
*   Running unit and integration tests
*   Building Docker images

It can be extended to include deployment steps.

## Usage Example: Monitoring an Application

To monitor an external application, you would typically integrate a small client-side SDK or a server-side agent that sends data to your monitoring system's API.

**Example Client-side JS snippet (for a web app):**

```javascript
// Assume your performance monitoring system is running and you have a Project API Key
const PMS_API_BASE_URL = 'http://localhost:5000/api/v1'; // Replace with your backend URL
const PMS_PROJECT_API_KEY = 'YOUR_PROJECT_API_KEY'; // Get this from your project settings in the dashboard

function sendMetric(type, data) {
    fetch(`${PMS_API_BASE_URL}/metrics/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': PMS_PROJECT_API_KEY
        },
        body: JSON.stringify({
            metricType: type,
            timestamp: new Date().toISOString(),
            data: data
        })
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to send metric:', response.statusText);
        }
    }).catch(error => {
        console.error('Error sending metric:', error);
    });
}

// Example 1: Monitor Page Load Time
window.addEventListener('load', () => {
    const navTiming = window.performance.getEntriesByType("navigation")[0];
    if (navTiming) {
        sendMetric('http_request', {
            url: window.location.href,
            method: 'GET',
            durationMs: navTiming.duration,
            status: 200, // Assuming successful load
            resourceType: 'page_load'
        });
    }
});

// Example 2: Monitor XHR/Fetch Requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const start = performance.now();
    try {
        const response = await originalFetch(...args);
        const end = performance.now();
        const durationMs = end - start;
        sendMetric('http_request', {
            url: args[0] instanceof Request ? args[0].url : args[0],
            method: args[0] instanceof Request ? args[0].method : 'GET', // Simplistic
            durationMs: durationMs,
            status: response.status,
            resourceType: 'fetch'
        });
        return response;
    } catch (error) {
        const end = performance.now();
        const durationMs = end - start;
        sendMetric('error', {
            message: error.message,
            stack: error.stack,
            url: args[0] instanceof Request ? args[0].url : args[0],
            type: 'network_error',
            durationMs: durationMs
        });
        throw error;
    }
};

// Example 3: Monitor Errors
window.addEventListener('error', (event) => {
    sendMetric('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : 'N/A',
        type: 'uncaught_error'
    });
});

// Example 4: Custom Event Metric
function trackButtonClick(buttonId) {
    sendMetric('custom_event', {
        eventName: 'button_click',
        buttonId: buttonId,
        userId: 'some_user_id', // Add relevant context
        additionalData: { value: 1 }
    });
}

// Call this when a specific button is clicked
// document.getElementById('myButton').addEventListener('click', () => trackButtonClick('myButton'));
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.
```