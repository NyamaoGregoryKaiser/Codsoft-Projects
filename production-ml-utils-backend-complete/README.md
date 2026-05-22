```markdown
# ML Utilities System

A comprehensive, full-stack Machine Learning Utilities system designed for enterprise use. This platform allows users to manage ML projects, datasets, models, and experiments, providing core CRUD operations, authentication/authorization, and basic model inference capabilities.

## Features

**Core Functionality:**
*   **Project Management:** Create, view, update, and delete ML projects.
*   **Dataset Management:** Upload, list, view details, and download datasets. Associated with projects.
*   **Model Management:** Upload, list, view details, download models, and run basic inference. Associated with projects.
*   **Experiment Tracking:** Record and view ML experiment runs, linking to specific models and datasets, tracking parameters and metrics.

**Enterprise-Grade Features:**
*   **Authentication & Authorization:** JWT-based user authentication, role-based access control (User, Admin).
*   **Logging & Monitoring:** Centralized logging with Winston, capturing application events and errors.
*   **Error Handling:** Global error handling middleware for consistent API error responses.
*   **Rate Limiting:** Protects API endpoints against brute-force attacks and abuse.
*   **Caching Layer (Conceptual):** Mentioned for future enhancement using Redis or similar.
*   **File Uploads:** Secure handling of dataset and model files with Multer.

**Technology Stack:**
*   **Backend:** Node.js, Express, TypeScript, TypeORM, PostgreSQL
*   **Frontend:** React, TypeScript, Material-UI, Axios
*   **Database:** PostgreSQL
*   **Containerization:** Docker, Docker Compose
*   **Testing:** Jest, Supertest, React Testing Library
*   **CI/CD:** GitHub Actions (configuration provided)

## Project Structure

```
ml-utilities-system/
├── backend/                  # Node.js/Express/TypeScript API
│   ├── src/                  # Source code for backend
│   │   ├── auth/             # Authentication logic
│   │   ├── config/           # Environment configuration
│   │   ├── database/         # TypeORM setup, migrations, seeds
│   │   ├── middleware/       # Global Express middleware (error handling, auth, rate limiting)
│   │   ├── modules/          # Feature modules (users, projects, datasets, models, experiments)
│   │   ├── routes/           # API route definitions
│   │   ├── tests/            # Backend unit, integration, API tests
│   │   ├── utils/            # Utility functions (logger, AppError, file uploads)
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server entry point
│   ├── .env.example          # Example environment variables
│   ├── dockerfile            # Dockerfile for backend service
│   ├── package.json          # Backend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── ormconfig.json        # TypeORM database configuration
├── frontend/                 # React/TypeScript web application
│   ├── public/               # Public assets
│   ├── src/                  # Source code for frontend
│   │   ├── api/              # Axios API client
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Contexts (e.g., AuthContext)
│   │   ├── hooks/            # Custom React Hooks (e.g., useFetch)
│   │   ├── pages/            # Application pages/views
│   │   ├── router/           # React Router setup, protected routes
│   │   ├── styles/           # Global styles
│   │   ├── tests/            # Frontend unit tests
│   │   ├── utils/            # Frontend utilities
│   │   ├── App.tsx           # Main React App component
│   │   └── index.tsx         # React entry point
│   ├── .env.example          # Example environment variables
│   ├── dockerfile            # Dockerfile for frontend service
│   ├── package.json          # Frontend dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration
├── .github/                  # GitHub Actions CI/CD workflows
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── docs/                     # Project documentation
│   ├── architecture.md
│   ├── api.md
│   ├── deployment.md
│   └── swagger.json          # OpenAPI/Swagger definition
├── docker-compose.yml        # Orchestration for all services (backend, frontend, db)
└── README.md                 # This README file
```

## Setup and Installation

### Prerequisites

*   Node.js (v18 or higher) & npm/yarn
*   Docker & Docker Compose
*   PostgreSQL client (optional, for direct DB access)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ml-utilities-system.git
cd ml-utilities-system
```

### 2. Environment Variables

Create `.env` files based on the provided `.env.example` for both `backend` and `frontend` directories.

**`backend/.env`**:
```
PORT=5000
DATABASE_URL=postgresql://user:password@db:5432/ml_utilities_db # 'db' for Docker Compose, 'localhost' for local
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRES_IN=1d
LOG_LEVEL=info
STORAGE_PATH=./uploads
```
*(Note: For local development without Docker Compose, set `DATABASE_URL` host to `localhost` and ensure you have a local PostgreSQL running.)*

**`frontend/.env`**:
```
VITE_API_BASE_URL=/api/v1 # For development with Vite proxy
# For production/direct Docker access, change to: VITE_API_BASE_URL=http://localhost:5000/api/v1 (or backend service name in docker-compose)
```

### 3. Build and Run with Docker Compose (Recommended)

This method simplifies setup by running all services in containers.

```bash
# 1. Build the Docker images
docker-compose build

# 2. Start the services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# 3. Wait for the database and backend to be ready, then run migrations and seed data
# You might need to wait a few seconds after `docker-compose up` for the DB to be fully ready.
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed
```

Once all services are up and running:
*   **Backend API:** `http://localhost:5000/api/v1`
*   **Frontend App:** `http://localhost:3000`

You can access the frontend in your browser at `http://localhost:3000`.
Default admin credentials after seeding: `admin@example.com` / `adminpassword`
Default user credentials after seeding: `user@example.com` / `userpassword`

### 4. Local Development (Without Docker Compose)

#### Backend:
```bash
cd backend

# Install dependencies
yarn install # or npm install

# Run TypeORM migrations (ensure PostgreSQL is running locally)
yarn typeorm migration:run

# Seed initial data
yarn seed

# Start the development server
yarn dev
```
The backend API will be available at `http://localhost:5000`.

#### Frontend:
```bash
cd frontend

# Install dependencies
yarn install # or npm install

# Start the development server
yarn dev
```
The frontend application will be available at `http://localhost:3000`.

## Testing

### Backend Tests

```bash
cd backend
yarn test         # Run all tests
yarn test:watch   # Run tests in watch mode
```

### Frontend Tests

```bash
cd frontend
yarn test         # Run all tests
yarn test:watch   # Run tests in watch mode
```

## Code Quality

*   ESLint is configured for both backend and frontend.
*   TypeScript for type safety.
*   Unit and integration tests aim for high coverage.

```bash
cd backend
yarn lint

cd frontend
yarn lint
```

## Additional Notes

*   **File Storage:** Currently, uploaded datasets and models are stored locally in the `backend/uploads` directory. For production, consider integrating with cloud storage solutions like AWS S3, Google Cloud Storage, or Azure Blob Storage.
*   **Model Inference:** The `runInference` endpoint for models is a placeholder. In a real-world scenario, this would involve loading the actual ML model (e.g., using a framework like TensorFlow.js, or by sending data to a dedicated ML inference service/microservice written in Python).
*   **Caching:** A caching layer could be added using Redis for frequently accessed data (e.g., project lists) to improve performance.

---
```