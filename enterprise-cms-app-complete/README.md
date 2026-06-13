# Enterprise-Grade Content Management System (CMS)

This project provides a comprehensive, production-ready Content Management System (CMS) built with Node.js (Express), React, and PostgreSQL. It demonstrates a full-stack architecture with multiple modules, API endpoints, robust authentication/authorization, caching, logging, and infrastructure setup.

## Features

**Core CMS Functionality:**
*   **User Management:** Register, Login, User Profiles, Role-Based Access Control (RBAC) with roles like Admin, Editor, Author, Subscriber.
*   **Post Management:** Create, Read, Update, Delete posts. Supports draft/published/archived statuses. Automatic slug generation.
*   **Category Management:** Organize posts into categories with CRUD operations.
*   **Media Management:** Upload, list, and delete image/file assets.

**Technical Features:**
*   **Backend:** Node.js with Express.js
*   **Frontend:** React.js
*   **Database:** PostgreSQL with Sequelize ORM for migrations, models, and seeders.
*   **Authentication:** JWT (JSON Web Tokens) for secure API access.
*   **Authorization:** Middleware for role-based access control.
*   **Error Handling:** Centralized error middleware with custom `ApiError` class.
*   **Logging:** Winston for structured logging to console and files.
*   **Caching:** Redis integration for API response caching (e.g., posts, categories).
*   **Rate Limiting:** `express-rate-limit` to protect against brute-force attacks and abuse.
*   **File Uploads:** Multer for handling multipart/form-data.
*   **Input Validation:** Joi schemas for robust request body validation.
*   **Security:** Helmet for various HTTP header protections, CORS configuration.
*   **Containerization:** Docker and Docker Compose for easy setup and deployment.
*   **Testing:** Unit and Integration tests using Jest and Supertest (backend).
*   **Documentation:** Comprehensive `README.md`, API documentation (via JSDoc), Architecture overview, Deployment guide.

## Project Structure

```
cms-project/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── config/           # Database, app configurations
│   │   ├── controllers/      # Handle request/response, delegate to services
│   │   ├── middleware/       # Auth, error, rate limit, upload handling
│   │   ├── models/           # Sequelize model definitions
│   │   ├── routes/           # API routes definitions
│   │   ├── services/         # Business logic, database interactions, caching
│   │   ├── utils/            # JWT, Logger
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Entry point, DB connection
│   ├── migrations/           # Sequelize migrations for DB schema changes
│   ├── seeders/              # Initial data for the database
│   ├── tests/                # Unit and Integration tests
│   ├── .env.example          # Environment variables template
│   ├── Dockerfile            # Dockerfile for backend production build
│   ├── package.json          # Backend dependencies and scripts
│   └── README.md             # Backend specific README
├── frontend/                 # React UI application
│   ├── public/
│   ├── src/
│   │   ├── api/              # API client (Axios)
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page-level React components
│   │   ├── utils/            # AuthContext
│   │   ├── App.js            # Main app component
│   │   ├── index.js          # React entry point
│   │   └── router.js         # React Router setup
│   ├── .env.example          # Frontend environment variables template
│   ├── Dockerfile.dev        # Dockerfile for frontend development
│   ├── Dockerfile            # Dockerfile for frontend production build
│   ├── nginx/                # Nginx configuration for production frontend
│   ├── package.json          # Frontend dependencies and scripts
│   └── README.md             # Frontend specific README
├── .github/                  # CI/CD workflows (GitHub Actions)
│   └── workflows/
│       └── ci-cd.yml
├── docs/                     # Detailed documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── API_DOCS.md
├── docker-compose.yml        # Orchestrates backend, database, redis for development
└── README.md                 # This root README
```

## Setup Instructions

### Prerequisites
*   Docker and Docker Compose installed
*   Node.js (v18+) and npm (or yarn) if running without Docker for development.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cms-project.git
cd cms-project
```

### 2. Environment Variables

Create `.env` files based on the provided `.env.example` files:

*   **Root `cms-project/.env`**:
    ```
    # Database
    DB_USER=cms_user
    DB_PASSWORD=cms_password
    DB_NAME=cms_db

    # JWT Secret (generate a strong, random one)
    JWT_SECRET=your_super_secret_jwt_key_here_at_least_32_chars
    JWT_EXPIRES_IN=1d

    # Redis Cache (generate a strong, random one)
    REDIS_PASSWORD=your_redis_password_here

    # File Uploads
    UPLOAD_PATH=uploads/
    MAX_FILE_SIZE=5242880 # 5MB

    # Rate Limiting
    RATE_LIMIT_WINDOW_MS=60000 # 1 minute
    RATE_LIMIT_MAX_REQUESTS=100
    ```
    *Note: The `docker-compose.yml` uses these variables directly.*

*   **`backend/.env`**:
    Copy the content of `backend/.env.example` to `backend/.env`. These are used if you run the backend *without* Docker Compose locally (e.g., `npm run dev` from `backend/` directory). Make sure these match the root `.env` values.

*   **`frontend/.env`**:
    Copy the content of `frontend/.env.example` to `frontend/.env`.
    ```
    REACT_APP_API_BASE_URL=http://localhost:5000/api
    ```
    This tells the React app where to find the backend API.

### 3. Running with Docker Compose (Recommended for Development)

This will set up PostgreSQL, Redis, Node.js backend, and React frontend in isolated containers.

```bash
# From the project root (cms-project/)
docker-compose up --build
```

*   The backend will be accessible at `http://localhost:5000` (API endpoints at `http://localhost:5000/api`).
*   The frontend will be accessible at `http://localhost:3000`.

Wait for all services to start. You can check logs using `docker-compose logs -f`.

### 4. Database Setup (Initial Migration & Seeding)

Once the `db` and `backend` services are up and healthy, run migrations and seed data:

```bash
# Open a new terminal in the project root
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

This will create the necessary tables and populate them with initial users (admin, editor, author, subscriber) and some sample posts/categories.

**Default Seeded Users:**
*   **Admin:** `admin@example.com` / `adminpassword`
*   **Editor:** `editor@example.com` / `editorpassword`
*   **Author:** `author@example.com` / `authorpassword`
*   **Subscriber:** `subscriber@example.com` / `subscriberpassword`

### 5. Access the Application

*   **Frontend (React UI):** Open your browser to `http://localhost:3000`
*   **Backend API:** Access endpoints via `http://localhost:5000/api` (e.g., `/api/posts`, `/api/auth/login`)

You can now log in with the seeded users and explore the CMS functionalities.

## Development without Docker Compose (Alternative)

If you prefer to run services individually on your host machine:

### Backend
1.  Navigate to `backend/`: `cd backend`
2.  Install dependencies: `npm install`
3.  Ensure a PostgreSQL database is running on your machine and create `cms_db`.
4.  Set up environment variables in `backend/.env` to point to your local PostgreSQL and Redis.
5.  Run migrations: `npm run migrate`
6.  Run seeders: `npm run seed`
7.  Start the backend: `npm run dev` (uses nodemon for auto-restarts)

### Frontend
1.  Navigate to `frontend/`: `cd frontend`
2.  Install dependencies: `npm install`
3.  Set `REACT_APP_API_BASE_URL` in `frontend/.env` to point to your running backend (e.g., `http://localhost:5000/api`).
4.  Start the frontend: `npm start`

---

## 4. Testing & Quality

### Backend Testing (Jest & Supertest)

**`backend/package.json`** includes scripts for testing:
*   `npm test`: Runs all tests with coverage report.
*   `npm test:watch`: Runs tests in watch mode.

**backend/tests/setup.js**
```javascript