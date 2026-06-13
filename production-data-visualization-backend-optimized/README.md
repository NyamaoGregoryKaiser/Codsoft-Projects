```markdown
# Data Visualization Tools System

A comprehensive, full-stack, enterprise-grade data visualization platform built with TypeScript, Node.js (Express), React, and PostgreSQL (simulated with SQLite for quick local setup).

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Architecture](#architecture)
3.  [Features](#features)
4.  [Technology Stack](#technology-stack)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
    *   [Manual Setup](#manual-setup)
6.  [Running the Application](#running-the-application)
7.  [Database](#database)
    *   [Schema](#schema)
    *   [Migrations](#migrations)
    *   [Seed Data](#seed-data)
8.  [API Documentation](#api-documentation)
9.  [Frontend Usage](#frontend-usage)
10. [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (K6 Example)](#performance-tests-k6-example)
11. [CI/CD](#cicd)
12. [Logging and Monitoring](#logging-and-monitoring)
13. [Error Handling](#error-handling)
14. [Caching](#caching)
15. [Rate Limiting](#rate-limiting)
16. [Future Enhancements](#future-enhancements)
17. [Contributing](#contributing)
18. [License](#license)

## 1. Project Overview

This system provides a robust platform for users to manage their data, create interactive visualizations, and organize them into shareable dashboards. It's designed for scalability, security, and a rich user experience, targeting business solutions and data analytics use cases.

## 2. Architecture

### Frontend (React.js)
*   **Components:** Modular UI elements for reusability.
*   **Pages:** Distinct views for different functionalities (Login, Dashboard, Viz Editor).
*   **Context API:** Global state management for user authentication and shared data.
*   **Axios:** HTTP client for API interaction.
*   **React Router:** Client-side routing.
*   **Chart.js:** Library for rendering various chart types.

### Backend (Node.js with Express)
*   **Controllers:** Handle specific API requests, validate input, and orchestrate business logic.
*   **Middleware:** Functions for authentication (JWT), authorization, logging, error handling, rate limiting, and caching.
*   **Models/Interfaces:** Define data structures and types for clarity and type safety.
*   **Utilities:** Helper functions for JWT operations, data processing, logging.
*   **Database Interaction:** Direct SQL queries (or an ORM in a larger project) for data persistence.

### Database (PostgreSQL)
*   **Entities:** Users, DataSources, Visualizations, Dashboards.
*   **Schema:** Defined in `database/schema.sql`.
*   **Migrations:** Managed through SQL scripts in `database/migrations`.
*   **Seed Data:** Initial data for development in `database/seed.sql`.

## 3. Features

*   **User Authentication & Authorization:** Secure JWT-based login, registration, and role-based access control (Admin/User).
*   **Data Source Management:**
    *   Upload CSV files.
    *   View uploaded data metadata.
    *   (Extendable to connect to external databases like PostgreSQL, MySQL, MongoDB).
*   **Visualization Editor:**
    *   Select an uploaded data source.
    *   Choose from various chart types (Bar, Line, Pie, Scatter).
    *   Configure chart properties (x-axis, y-axis, labels, colors).
    *   Save, update, and delete visualizations.
*   **Dashboard Management:**
    *   Create new dashboards.
    *   Add existing visualizations to a dashboard.
    *   Arrange and resize visualizations within a dashboard.
    *   View and share dashboards.
*   **Robust API:** Full CRUD operations for all core entities.
*   **Logging:** Centralized logging with Winston.
*   **Error Handling:** Global middleware for consistent error responses.
*   **Caching:** In-memory caching for frequently accessed static data.
*   **Rate Limiting:** Protects API endpoints from abuse.
*   **Docker Support:** Containerized setup for easy deployment.
*   **CI/CD:** Basic GitHub Actions workflow for automated testing and deployment.
*   **Comprehensive Testing:** Unit, integration, and API tests.

## 4. Technology Stack

*   **Frontend:**
    *   React.js
    *   TypeScript
    *   Chart.js
    *   Axios
    *   React Router DOM
    *   Tailwind CSS (or similar for styling - for this demo, minimal inline styling will be used or simple CSS)
*   **Backend:**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   jsonwebtoken (JWT)
    *   bcrypt.js (Password hashing)
    *   multer (File uploads)
    *   csv-parser (CSV processing)
    *   winston (Logging)
    *   better-sqlite3 (Database driver for local dev/Docker compose demonstration)
*   **Database:**
    *   PostgreSQL (Production target)
    *   SQLite (Used in Docker Compose for demonstration purposes)
*   **Testing:**
    *   Jest
    *   Supertest
    *   React Testing Library
    *   K6 (for performance testing example)
*   **DevOps:**
    *   Docker
    *   Docker Compose
    *   GitHub Actions

## 5. Setup and Installation

### Prerequisites

*   Node.js (v18+) and npm (v9+)
*   Docker and Docker Compose (if using the recommended setup)
*   Git

### Using Docker Compose (Recommended)

This is the easiest way to get the entire system running quickly.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/data-viz-system.git
    cd data-viz-system
    ```

2.  **Create `.env` file:**
    Copy `.env.example` to `.env` in the root directory and fill in any required values.
    ```bash
    cp .env.example .env
    # You might want to generate a strong JWT_SECRET
    ```

3.  **Build and run the containers:**
    ```bash
    docker-compose up --build -d
    ```
    This will:
    *   Build the `backend` Docker image.
    *   Start the `backend` service (Node.js application).
    *   Start the `database` service (SQLite in this setup, mimicking a PostgreSQL flow).
    *   Run initial database setup (schema, migrations, seed data).
    *   Build and serve the `frontend` application.

    Wait a few minutes for all services to initialize.

### Manual Setup (Without Docker Compose for Backend and Database)

If you prefer to run the backend and frontend separately and manage your own database:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/data-viz-system.git
    cd data-viz-system
    ```

2.  **Create `.env` file:**
    Copy `.env.example` to `.env` in the root directory and fill in any required values.

3.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    npm run build # Compiles TypeScript to JavaScript
    ```

4.  **Database Setup (SQLite):**
    The backend uses `better-sqlite3`. When the backend starts for the first time, it will attempt to create the `database.sqlite` file in the `backend/data` directory and apply schema/seed data. Ensure the `backend/data` directory exists:
    ```bash
    mkdir -p backend/data
    ```
    You can manually run the schema and seed scripts if needed, but the backend handles it on startup.
    (For PostgreSQL, you'd configure `DATABASE_URL` in `.env` and manually run `psql -f database/schema.sql`, etc.)

5.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```

## 6. Running the Application

### With Docker Compose:
After running `docker-compose up -d`:
*   **Backend API:** `http://localhost:5000`
*   **Frontend Web App:** `http://localhost:3000`

### Manual Setup:

1.  **Start Backend:**
    ```bash
    cd backend
    npm start # Or `npm run dev` for watch mode
    ```
    The backend will be available at `http://localhost:5000`.

2.  **Start Frontend:**
    ```bash
    cd frontend
    npm start
    ```
    The frontend will be available at `http://localhost:3000`.

## 7. Database

The system uses a relational database. For production, PostgreSQL is recommended. For local development and demonstration with Docker Compose, SQLite is used for simplicity. The schema below is compatible with PostgreSQL.

### Schema

The `database/schema.sql` defines the following tables:

*   **`users`**: Stores user information, including roles (admin/user).
    *   `id` (PK)
    *   `username` (UNIQUE)
    *   `email` (UNIQUE)
    *   `password` (hashed)
    *   `role` (`admin` | `user`)
    *   `created_at`, `updated_at`
*   **`data_sources`**: Stores metadata about uploaded data files.
    *   `id` (PK)
    *   `user_id` (FK to `users`)
    *   `name`
    *   `file_path` (path on server)
    *   `file_type` (`csv`)
    *   `column_headers` (JSON array of strings)
    *   `created_at`, `updated_at`
*   **`visualizations`**: Stores configuration for individual charts.
    *   `id` (PK)
    *   `user_id` (FK to `users`)
    *   `data_source_id` (FK to `data_sources`)
    *   `name`
    *   `chart_type` (`bar`, `line`, `pie`, `scatter`)
    *   `config` (JSON object containing chart-specific options: x-axis, y-axis, labels, colors, etc.)
    *   `created_at`, `updated_at`
*   **`dashboards`**: Stores collections of visualizations.
    *   `id` (PK)
    *   `user_id` (FK to `users`)
    *   `name`
    *   `description`
    *   `created_at`, `updated_at`
*   **`dashboard_visualizations`**: Junction table for many-to-many relationship between dashboards and visualizations.
    *   `dashboard_id` (FK to `dashboards`)
    *   `visualization_id` (FK to `visualizations`)
    *   `position` (e.g., JSON {x, y, w, h} for layout)
    *   `created_at`

### Migrations

Database migrations are handled by SQL scripts located in `database/migrations/`.
The backend will apply these sequentially on startup if they haven't been applied yet.

### Seed Data

The `database/seed.sql` script populates the database with initial data, including:
*   An `admin` user (`admin@example.com`, password: `password123`).
*   A `user` user (`user@example.com`, password: `password123`).
*   Sample data sources, visualizations, and a dashboard for demonstration.

## 8. API Documentation

The backend API is designed as a RESTful service. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api`

---

### Authentication

*   **`POST /api/auth/register`**
    *   Registers a new user.
    *   **Body:** `{ username, email, password }`
    *   **Response:** `{ message: "User registered successfully", userId: string }`
*   **`POST /api/auth/login`**
    *   Logs in a user and returns a JWT token.
    *   **Body:** `{ email, password }`
    *   **Response:** `{ token: string, user: { id, username, email, role } }`
*   **`GET /api/auth/profile`** (Protected)
    *   Retrieves the profile of the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `{ id, username, email, role }`

### Users (Admin Only)

*   **`GET /api/users`** (Protected, Admin)
    *   Get all users.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`GET /api/users/:id`** (Protected, Admin)
    *   Get user by ID.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`PUT /api/users/:id`** (Protected, Admin)
    *   Update user by ID.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body:** `{ username?, email?, role? }`
*   **`DELETE /api/users/:id`** (Protected, Admin)
    *   Delete user by ID.
    *   **Headers:** `Authorization: Bearer <token>`

### Data Sources

*   **`POST /api/data-sources/upload`** (Protected)
    *   Uploads a CSV file as a new data source.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body (multipart/form-data):** `file` (the CSV file), `name` (string)
    *   **Response:** `{ id, name, file_path, column_headers, ... }`
*   **`GET /api/data-sources`** (Protected)
    *   Get all data sources for the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`GET /api/data-sources/:id`** (Protected)
    *   Get a specific data source by ID.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`GET /api/data-sources/:id/data`** (Protected)
    *   Get the actual data content of a data source.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Response:** `Array<Object>` (rows of data)
*   **`DELETE /api/data-sources/:id`** (Protected)
    *   Delete a data source.
    *   **Headers:** `Authorization: Bearer <token>`

### Visualizations

*   **`POST /api/visualizations`** (Protected)
    *   Create a new visualization.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body:** `{ data_source_id, name, chart_type, config: { x_axis, y_axis, ... } }`
    *   **Response:** `{ id, name, ... }`
*   **`GET /api/visualizations`** (Protected)
    *   Get all visualizations for the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`GET /api/visualizations/:id`** (Protected)
    *   Get a specific visualization by ID.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`PUT /api/visualizations/:id`** (Protected)
    *   Update a visualization.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body:** `{ name?, chart_type?, config? }`
*   **`DELETE /api/visualizations/:id`** (Protected)
    *   Delete a visualization.
    *   **Headers:** `Authorization: Bearer <token>`

### Dashboards

*   **`POST /api/dashboards`** (Protected)
    *   Create a new dashboard.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body:** `{ name, description?, visualization_ids?: Array<{ id: string, position: object }> }`
    *   **Response:** `{ id, name, ... }`
*   **`GET /api/dashboards`** (Protected)
    *   Get all dashboards for the authenticated user.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`GET /api/dashboards/:id`** (Protected)
    *   Get a specific dashboard by ID with its visualizations.
    *   **Headers:** `Authorization: Bearer <token>`
*   **`PUT /api/dashboards/:id`** (Protected)
    *   Update a dashboard.
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Body:** `{ name?, description?, visualizations?: Array<{ id: string, position: object }> }`
*   **`DELETE /api/dashboards/:id`** (Protected)
    *   Delete a dashboard.
    *   **Headers:** `Authorization: Bearer <token>`

---

## 9. Frontend Usage

1.  **Register/Login:** Navigate to `/register` or `/login`. Use `admin@example.com` / `password123` or `user@example.com` / `password123` if using seed data.
2.  **Data Sources:** Go to the "Data Sources" page. Upload a CSV file (sample CSVs can be created, e.g., `data.csv` with `Name,Age,City` header and some rows).
3.  **Create Visualization:** Go to "New Visualization". Select an uploaded data source. Choose a chart type (Bar, Line, Pie, Scatter). Configure the X and Y axes (for Bar/Line/Scatter) or labels/values (for Pie). Save the visualization.
4.  **Create Dashboard:** Go to "New Dashboard". Give it a name. Add previously created visualizations. Arrange them as desired. Save the dashboard.
5.  **View Dashboard:** Go to "Dashboards" and select one to view your compiled visualizations.

## 10. Testing

### Backend Tests

To run all backend tests:
```bash
cd backend
npm test
```

*   **Unit Tests:** Located in `backend/tests/unit/`. Test individual functions, middleware, and helpers in isolation. (Example: `jwt.utils.test.ts`, `auth.middleware.test.ts`).
*   **Integration/API Tests:** Located in `backend/tests/integration/`. Use Supertest to make HTTP requests to the Express app and assert responses. (Example: `auth.routes.test.ts`, `data-sources.routes.test.ts`).

### Frontend Tests

To run all frontend tests:
```bash
cd frontend
npm test
```

*   **Unit/Component Tests:** Located in `frontend/src/tests/`. Use Jest and React Testing Library to test components, pages, and hooks. (Example: `Login.test.tsx`, `ChartRenderer.test.tsx`).

### Performance Tests (K6 Example)

K6 is an open-source load testing tool. Here's a very basic example script you could use:

```javascript
// backend/tests/performance/k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// You'd typically get a token from a login endpoint first
const AUTH_TOKEN = 'YOUR_ADMIN_OR_USER_JWT_TOKEN'; // Replace with a valid token

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Simulate 20 users for 30 seconds
    { duration: '1m', target: 50 },  // Ramp up to 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users for 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test getting data sources (read-heavy endpoint)
  let res = http.get('http://localhost:5000/api/data-sources', { headers });
  check(res, { 'get data sources status is 200': (r) => r.status === 200 });

  // Test getting user profile
  res = http.get('http://localhost:5000/api/auth/profile', { headers });
  check(res, { 'get profile status is 200': (r) => r.status === 200 });

  sleep(1); // Simulate user think time
}
```

To run this K6 script:
1.  Save it as `k6-load-test.js` in `backend/tests/performance/`.
2.  Install K6: `brew install k6` (macOS) or refer to K6 documentation.
3.  Generate a valid JWT token by logging in via the frontend or `POST /api/auth/login` and replace `YOUR_ADMIN_OR_USER_JWT_TOKEN` in the script.
4.  Run the test:
    ```bash
    k6 run backend/tests/performance/k6-load-test.js
    ```

## 11. CI/CD

A basic GitHub Actions workflow is configured in `.github/workflows/main.yml`. This workflow will:

1.  **Trigger:** On `push` to `main` branch or `pull_request` to `main`.
2.  **Jobs:**
    *   `build`: Installs dependencies for both frontend and backend, builds the TypeScript code.
    *   `test`: Runs all backend and frontend tests.
    *   (Optional) `deploy`: A placeholder job that would typically deploy the Docker images to a cloud provider (e.g., AWS ECR, Kubernetes, Azure App Service). This would require cloud-specific configurations and credentials.

**Example `main.yml`:**

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install Backend Dependencies
      run: npm install # Assumes root package.json has common scripts or navigate to backend/
      working-directory: ./backend

    - name: Build Backend
      run: npm run build
      working-directory: ./backend

    - name: Install Frontend Dependencies
      run: npm install
      working-directory: ./frontend

    - name: Build Frontend
      run: npm run build
      working-directory: ./frontend

    - name: Archive Backend Build
      uses: actions/upload-artifact@v4
      with:
        name: backend-build
        path: backend/dist

    - name: Archive Frontend Build
      uses: actions/upload-artifact@v4
      with:
        name: frontend-build
        path: frontend/build

  test:
    name: Run Tests
    needs: build # Ensure build passes before testing
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install Backend Dependencies
      run: npm install
      working-directory: ./backend

    - name: Run Backend Tests
      run: npm test
      working-directory: ./backend

    - name: Install Frontend Dependencies
      run: npm install
      working-directory: ./frontend

    - name: Run Frontend Tests
      run: npm test
      working-directory: ./frontend

  deploy:
    name: Deploy to Production
    needs: test # Ensure all tests pass before deploying
    runs-on: ubuntu-latest
    environment: Production # Optional: for environment-specific secrets
    if: github.ref == 'refs/heads/main' # Only deploy on push to main
    steps:
    - name: Download Backend Build Artifact
      uses: actions/download-artifact@v4
      with:
        name: backend-build
        path: backend/dist

    - name: Download Frontend Build Artifact
      uses: actions/download-artifact@v4
      with:
        name: frontend-build
        path: frontend/build

    # --- Placeholder for actual deployment steps ---
    # This section would contain commands to:
    # 1. Login to Docker registry (e.g., AWS ECR, Docker Hub)
    # 2. Tag and push Docker images
    # 3. Update Kubernetes deployment, or deploy to a cloud service (e.g., AWS ECS, Azure App Service)
    - name: Simulate Deployment
      run: |
        echo "Deploying backend and frontend to production environment..."
        echo "Backend build content:"
        ls -F backend/dist
        echo "Frontend build content:"
        ls -F frontend/build
        echo "Deployment successful!"
        # Add real deployment commands here
```

## 12. Logging and Monitoring

*   **Winston:** The backend uses `winston` for structured logging. Logs are output to the console and can be easily configured to write to files, external log management services (e.g., ELK stack, Datadog), etc.
*   **Log Levels:** Information (info), Warnings (warn), Errors (error) are used.
*   **Monitoring:** While full-fledged monitoring systems (Prometheus, Grafana) are beyond this scope, the robust logging lays the foundation. In production, you'd integrate with APM tools (e.g., New Relic, Datadog) or cloud-native monitoring solutions.

## 13. Error Handling

*   **Centralized Error Middleware:** A global error handling middleware (`backend/src/middleware/errorHandler.ts`) catches all errors thrown in the application.
*   **Consistent Responses:** Ensures that all error responses follow a standardized JSON format (e.g., `{ success: false, message: string, errors?: Array<string> }`).
*   **Logging Errors:** All errors are logged with appropriate details to aid debugging.
*   **Specific Error Classes:** Custom error classes (e.g., `APIError`) can be created for more granular control over error types and status codes.

## 14. Caching

*   **In-Memory Cache:** A simple in-memory cache (`backend/src/utils/cache.ts`) is implemented for GET requests that fetch data sources or visualizations.
*   **Cache Invalidation:** The cache is invalidated upon CRUD operations for the relevant resources (e.g., `POST`, `PUT`, `DELETE` for data sources will clear the data source cache).
*   **Mechanism:** Uses a `Map` object in Node.js, suitable for single-instance applications or as a basic demonstration. For multi-instance deployments, a distributed cache like Redis would be used.

## 15. Rate Limiting

*   **In-Memory Rate Limiter:** A basic rate limiting middleware (`backend/src/middleware/rateLimit.ts`) tracks request counts per IP address.
*   **Configuration:** Configurable limits (e.g., `maxRequests`, `windowMs`).
*   **Protection:** Prevents abuse of API endpoints by blocking requests exceeding a defined threshold within a time window.
*   **Mechanism:** Uses a `Map` to store request counts, similar to caching. For production, a more robust solution involving Redis or dedicated rate-limiting services would be implemented.

## 16. Future Enhancements

*   **Advanced Data Sources:** Connect to external databases (PostgreSQL, MySQL, MongoDB), cloud storage (S3, GCS).
*   **Real-time Dashboards:** Implement WebSockets for real-time data updates.
*   **More Chart Types & Customization:** Expand charting library and options.
*   **Drag-and-Drop Layout:** Enhance dashboard editing with more flexible layout options.
*   **Data Transformation:** Add ETL capabilities within the platform (e.g., SQL query builder, data cleaning tools).
*   **User Collaboration:** Share dashboards/visualizations with other users.
*   **Subscription/Billing:** Integrate payment gateway for SaaS model.
*   **Multi-tenancy:** Support multiple isolated organizations.
*   **AI/ML Integrations:** Anomaly detection, predictive analytics.
*   **Improved Caching:** Implement Redis for distributed caching.
*   **File Storage:** Integrate with cloud storage services (AWS S3, Google Cloud Storage) for uploaded data files.
*   **Security Scans:** Integrate SAST/DAST tools into CI/CD.

## 17. Contributing

Feel free to fork the repository, open issues, and submit pull requests.

## 18. License

This project is licensed under the MIT License.
```