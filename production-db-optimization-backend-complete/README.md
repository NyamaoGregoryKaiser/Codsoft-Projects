# DBTune: Database Performance Monitoring and Optimization Assistant

DBTune is a full-stack web application designed to help database administrators and developers monitor the performance of their PostgreSQL databases, analyze SQL query execution plans, and receive actionable optimization suggestions.

## Features

*   **Database Connection Management:** Securely store and manage connections to multiple PostgreSQL instances.
*   **Query Analysis:** Submit SQL queries and receive `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON)` output parsed into a human-readable format, along with specific optimization suggestions (e.g., missing indexes, inefficient joins, high-cost operations).
*   **Performance Dashboard:** View real-time and historical metrics for connected databases, including active connections, database size, cache hit ratio, and slow query counts (simulated for now, extensible to real `pg_stat_*` views).
*   **Optimization History:** Track past query analyses and the status of applied suggestions.
*   **Schema Viewer:** Browse tables, columns, indexes, and constraints of connected databases.
*   **Authentication & Authorization:** Secure user login with JWT, role-based access control (user/admin).
*   **Logging & Monitoring:** Comprehensive backend logging with Winston and HTTP request logging with Morgan.
*   **Error Handling:** Centralized error handling middleware.
*   **Caching:** In-memory caching for active database connections to reduce overhead.
*   **Rate Limiting:** Protects API endpoints from abuse.

## Technologies Used

**Backend (Node.js/Express.js)**
*   **Framework:** Express.js
*   **Database:** PostgreSQL (for DBTune's own data)
*   **ORM/Query Builder:** Knex.js
*   **Authentication:** JWT (jsonwebtoken), bcrypt.js
*   **Logging:** Winston, Morgan
*   **Caching:** node-cache
*   **Security:** helmet, express-rate-limit, cors
*   **Database Driver:** `pg` (for connecting to target PostgreSQL databases)

**Frontend (React)**
*   **Framework:** React.js
*   **UI Library:** Ant Design
*   **State Management:** React Context API
*   **Routing:** React Router DOM
*   **API Client:** Axios
*   **Charts:** Chart.js, react-chartjs-2
*   **Cookies:** js-cookie

**Development & Deployment**
*   **Containerization:** Docker, Docker Compose
*   **CI/CD:** GitHub Actions (basic setup)
*   **Testing:** Jest, Supertest (backend), React Testing Library (frontend), K6 (performance example)

## Architecture Overview

DBTune follows a typical **Client-Server Architecture** with a clear separation of concerns:

*   **Frontend (React):** A Single Page Application (SPA) that provides the user interface. It communicates with the backend API via RESTful endpoints.
*   **Backend (Node.js/Express):** Serves the API, handles business logic, interacts with DBTune's internal PostgreSQL database, and establishes secure connections to target PostgreSQL databases for monitoring and analysis.

**Data Flow (Query Analysis Example):**
1.  **User (Frontend):** Submits a SQL query and selects a connected database.
2.  **Frontend:** Sends the query and connection ID to the Backend API (`/api/queries/analyze`).
3.  **Backend (Controller -> Service):**
    *   Authenticates and authorizes the user.
    *   Retrieves encrypted connection details from DBTune's database.
    *   Decrypts the password.
    *   Establishes a temporary or cached `pg.Client` connection to the *target* database.
    *   Executes `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) <query>` on the *target* database.
    *   Parses the `EXPLAIN` output using `explainPlanParser.js`.
    *   Generates optimization suggestions based on predefined rules.
    *   Stores the query, `EXPLAIN` plan, and suggestions in DBTune's *internal* database.
    *   Returns the analysis and suggestions to the frontend.
4.  **Frontend:** Displays the parsed `EXPLAIN` plan, performance metrics, and actionable suggestions to the user.

## Setup and Installation

### Prerequisites

*   Node.js (v18+) & npm/yarn
*   Docker & Docker Compose (recommended for easy setup)
*   PostgreSQL (optional, if not using Docker Compose)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/dbtune.git
cd dbtune
```

### 2. Environment Configuration

Create a `.env` file in the root directory of the project, based on `.env.example`.
Ensure `ENCRYPTION_KEY` is exactly 32 characters long. Generate a strong random key for production.

```bash
cp .env.example .env
# Open .env and fill in your details
```

**Example `.env` content:**

```dotenv
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration (for DBTune itself)
DB_HOST=db
DB_PORT=5432
DB_USER=dbtune_user
DB_PASSWORD=password
DB_NAME=dbtune_dev

# JWT Secret for authentication
JWT_SECRET=supersecretjwtkeythatshouldbeverylongandrandominproduction

# Encryption Key for sensitive connection data (MUST be 32 characters long for AES-256)
ENCRYPTION_KEY=YourSuperStrong32CharEncryptionKey
```
*Note: `DB_HOST=db` when running with Docker Compose. If running backend directly, use `localhost`.*

### 3. Running with Docker Compose (Recommended)

This will build the Docker images, start the PostgreSQL database, run migrations/seeds, and launch both backend and frontend services.

```bash
docker-compose up --build
```

Access the application:
*   Frontend: `http://localhost:3000`
*   Backend API: `http://localhost:5000/api`

### 4. Manual Setup (Without Docker Compose for application services)

#### Backend Setup

```bash
cd src/server
yarn install
yarn migrate:latest # Apply database migrations for DBTune's database
yarn seed:run       # Seed initial admin user
yarn dev            # Start the backend server (with nodemon for auto-restart)
```
The backend will run on `http://localhost:5000`.

#### Frontend Setup

```bash
cd src/client
yarn install
yarn start          # Start the React development server
```
The frontend will run on `http://localhost:3000`.

### Initial Login Credentials

After running `yarn seed:run` (or `docker-compose up`), an admin user will be created:
*   **Email:** `admin@dbtune.com`
*   **Password:** `adminpassword`

## API Documentation

All API endpoints are prefixed with `/api`. Authentication via JWT `Bearer` token is required for most routes.

| Method | Endpoint                      | Description                                   | Authentication | Role           | Body (Example)                                                      | Response (Success)                                     |
| :----- | :---------------------------- | :-------------------------------------------- | :------------- | :------------- | :------------------------------------------------------------------ | :----------------------------------------------------- |
| `POST` | `/api/auth/register`          | Register a new user                           | Public         | N/A            | `{ username, email, password }`                                     | `{ id, username, email, role, token }`                 |
| `POST` | `/api/auth/login`             | Authenticate user and get JWT token           | Public         | N/A            | `{ email, password }`                                               | `{ id, username, email, role, token }`                 |
| `GET`  | `/api/auth/me`                | Get current authenticated user's profile      | Required       | Any            | N/A                                                                 | `{ id, username, email, role }`                        |
| `POST` | `/api/connections`            | Create a new database connection              | Required       | Any            | `{ name, host, port, user, password, database }`                    | `{ id, name, host, ... }`                              |
| `GET`  | `/api/connections`            | Get all user's connections                    | Required       | Any            | N/A                                                                 | `[{ id, name, host, ... }]`                            |
| `GET`  | `/api/connections/:id`        | Get connection by ID                          | Required       | Owner          | N/A                                                                 | `{ id, name, host, ... }`                              |
| `PUT`  | `/api/connections/:id`        | Update connection by ID                       | Required       | Owner          | `{ name?, host?, password? }`                                       | `{ id, name, host, ... }`                              |
| `DELETE`|`/api/connections/:id`        | Delete connection by ID                       | Required       | Owner          | N/A                                                                 | `{ message: "Connection deleted successfully" }`       |
| `GET`  | `/api/connections/:id/test`   | Test connectivity to a target database        | Required       | Owner          | N/A                                                                 | `{ message: "Connection successful!" }`                |
| `POST` | `/api/queries/analyze`        | Analyze a SQL query                           | Required       | Any            | `{ connectionId, query }`                                           | `{ query, totalTime, planJson, suggestions }`          |
| `GET`  | `/api/queries/history/:connId`| Get query analysis history for a connection   | Required       | Owner          | N/A                                                                 | `[{ id, query_text, total_time_ms, ... }]`             |
| `GET`  | `/api/queries/:analysisId`    | Get details of a specific analysis            | Required       | Owner          | N/A                                                                 | `{ id, query_text, plan_json, suggestions: [...] }`    |
| `PUT`  | `/api/queries/suggestions/:id`| Update status of an optimization suggestion   | Required       | Any            | `{ status: 'applied' \| 'dismissed' }`                              | `{ id, status, ... }`                                  |
| `GET`  | `/api/metrics/:connId/live`   | Get live metrics for a connection             | Required       | Owner          | N/A                                                                 | `{ active_connections, database_size_bytes, ... }`     |
| `GET`  | `/api/metrics/:connId/history`| Get historical metrics for a connection       | Required       | Owner          | `?timeRange=24h`                                                    | `[{ id, active_connections, created_at, ... }]`        |
| `POST` | `/api/metrics/:connId/record` | Manually record current metrics               | Required       | Owner          | N/A                                                                 | `{ message, data }`                                    |
| `GET`  | `/api/schema/:connId/tables`  | Get list of tables in a database              | Required       | Owner          | N/A                                                                 | `[{ tablename, schemaname }]`                          |
| `GET`  | `/api/schema/:connId/tables/:schema/:table`| Get details of a specific table       | Required       | Owner          | N/A                                                                 | `{ tableName, columns: [], indexes: [], constraints: [] }` |
| `GET`  | `/api/users`                  | Get all users                                 | Required       | Admin          | N/A                                                                 | `[{ id, username, email, role }]`                      |
| `PUT`  | `/api/users/:id`              | Update user by ID                             | Required       | Admin / Self   | `{ username?, email?, role? }`                                      | `{ id, username, email, role }`                        |
| `DELETE`|`/api/users/:id`              | Delete user by ID                             | Required       | Admin          | N/A                                                                 | `{ message: "User deleted successfully" }`             |

## Testing

To run tests:

**Backend Tests:**
```bash
cd src/server
yarn test
```
This runs Jest unit and integration tests. It will attempt to connect to a PostgreSQL instance for integration tests, configured via `TEST_DB_HOST`, `TEST_DB_PORT`, etc. in your `.env` file. You may need a separate test database running. The `docker-compose.yml` provides a commented-out `test_db` service you can enable.

**Frontend Tests:**
```bash
cd src/client
yarn test --coverage # To see coverage report
```
This runs React Testing Library tests for components and pages.

**Performance Tests (K6):**
```bash
# Ensure K6 is installed (https://k6.io/docs/getting-started/installation/)
# Run from the root directory
k6 run perf-tests/k6_load_test.js --env BASE_URL=http://localhost:5000/api --env USER_EMAIL=admin@dbtune.com --env USER_PASSWORD=adminpassword
```
*Adjust `BASE_URL`, `USER_EMAIL`, and `USER_PASSWORD` as needed.*

## CI/CD Pipeline (GitHub Actions Example)

A basic CI/CD pipeline is configured with GitHub Actions. It will:
1.  Checkout code.
2.  Set up Node.js.
3.  Install backend dependencies.
4.  Run backend tests.
5.  Install frontend dependencies.
6.  Run frontend tests.
7.  Build the Docker image.

See `.github/workflows/main.yml` for details.

```yaml