```markdown
# ML Utilities System

A comprehensive, full-stack Machine Learning Utilities System designed to manage ML models, datasets, and inference logs. This project emphasizes enterprise-grade practices, including robust testing, authentication, logging, caching, rate limiting, Dockerization, and detailed documentation.

## Table of Contents

1.  [Features](#features)
2.  [Technology Stack](#technology-stack)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Local Development Setup (Docker Compose)](#local-development-setup-docker-compose)
    *   [Manual Local Setup (Without Docker)](#manual-local-setup-without-docker)
4.  [Usage](#usage)
    *   [Authentication](#authentication)
    *   [Key Endpoints](#key-endpoints)
    *   [Frontend Navigation](#frontend-navigation)
5.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Tests (K6)](#performance-tests-k6)
6.  [Documentation](#documentation)
    *   [API Documentation](#api-documentation)
    *   [Architecture Documentation](#architecture-documentation)
    *   [Deployment Guide](#deployment-guide)
7.  [Additional Features](#additional-features)
8.  [Code Structure](#code-structure)
9.  [Contributing](#contributing)
10. [License](#license)

## Features

*   **Model Management:** Register, update, retrieve, and delete ML model metadata (name, version, description, type, endpoint URL, associated dataset).
*   **Dataset Management:** Catalog and manage datasets used by models, including name, description, source URL, and schema preview.
*   **Inference Simulation & Logging:** Provide a UI to submit data to registered models, simulate inference responses, and automatically log all inference requests and responses.
*   **User Authentication & Authorization:** Secure user registration, login (JWT-based), and role-based access control (admin/user) with resource ownership checks.
*   **Database Layer:** PostgreSQL with Sequelize ORM, including robust schema definitions, migration scripts, and seed data.
*   **Scalability & Resilience:** Caching layer for frequently accessed data, rate limiting for API protection, and structured error handling.
*   **Observability:** Centralized Winston-based logging for the backend.
*   **Comprehensive Testing:** Unit, integration, API, and performance tests to ensure code quality and reliability.
*   **Containerization:** Docker and Docker Compose setup for easy development and deployment.
*   **CI/CD (Conceptual):** Configuration for a GitHub Actions pipeline.
*   **Full-stack UI:** A responsive React frontend for intuitive interaction with the system.

## Technology Stack

*   **Backend:**
    *   **Runtime:** Node.js
    *   **Framework:** Express.js
    *   **Database:** PostgreSQL
    *   **ORM:** Sequelize
    *   **Authentication:** JSON Web Tokens (JWT)
    *   **Hashing:** bcryptjs
    *   **Logging:** Winston
    *   **Caching:** node-cache (in-memory)
    *   **Rate Limiting:** express-rate-limit
    *   **Security:** Helmet
    *   **Testing:** Jest, Supertest
*   **Frontend:**
    *   **Library:** React.js
    *   **Routing:** React Router DOM
    *   **API Client:** Axios
    *   **State Management:** React Context API (for Auth)
    *   **Testing:** Jest, React Testing Library
*   **Infrastructure:**
    *   **Containerization:** Docker, Docker Compose
    *   **CI/CD:** GitHub Actions (conceptual)
    *   **Performance Testing:** K6

## Getting Started

### Prerequisites

*   Node.js (v20 or higher)
*   npm (v10 or higher)
*   Docker & Docker Compose (recommended for easiest setup)
*   PostgreSQL (if not using Docker)

### Local Development Setup (Docker Compose - Recommended)

This is the easiest way to get the entire application up and running.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ml-utilities-system.git
    cd ml-utilities-system
    ```

2.  **Configure Environment Variables:**
    *   Copy the example environment files:
        ```bash
        cp backend/.env.example backend/.env
        cp frontend/.env.example frontend/.env
        ```
    *   Open `backend/.env` and `frontend/.env` and customize them if needed. Ensure `DB_HOST` in `backend/.env` is `db` (the service name in `docker-compose.yml`) and `REACT_APP_API_BASE_URL` in `frontend/.env` points to `http://localhost:5000/api/v1` for local Docker setup.

3.  **Build and Run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build Docker images for the backend (Node.js) and frontend (React + Nginx).
    *   Start a PostgreSQL database container.
    *   Run backend migrations and seed initial data (including an `admin` user with `admin@example.com` / `adminpassword`).
    *   Start the backend server on `http://localhost:5000`.
    *   Start the frontend server (served by Nginx) on `http://localhost:3000`.

4.  **Access the Application:**
    *   Frontend: `http://localhost:3000`
    *   Backend API: `http://localhost:5000/api/v1`

    You can log in with the seeded admin user:
    *   **Email:** `admin@example.com`
    *   **Password:** `adminpassword`

5.  **Stop Docker Compose:**
    ```bash
    docker-compose down
    ```

### Manual Local Setup (Without Docker)

If you prefer to run the backend and frontend directly on your machine:

#### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd ml-utilities-system/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Edit `.env` to point to your local PostgreSQL instance (e.g., `DB_HOST=localhost`).

4.  **Set up PostgreSQL Database:**
    *   Ensure you have a PostgreSQL server running.
    *   Create a database and a user for the application (matching your `.env` settings).
    *   Example using `psql`:
        ```sql
        CREATE USER ml_user WITH PASSWORD 'ml_password';
        CREATE DATABASE ml_utilities_db OWNER ml_user;
        GRANT ALL PRIVILEGES ON DATABASE ml_utilities_db TO ml_user;
        ```

5.  **Run Migrations and Seed Data:**
    ```bash
    npm run migrate
    npm run seed
    ```
    (This will create tables and insert the `admin` user).

6.  **Start the Backend Server:**
    ```bash
    npm run dev
    ```
    The backend will run on `http://localhost:5000`.

#### 2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ml-utilities-system/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    *   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    *   Ensure `REACT_APP_API_BASE_URL` in `.env` points to your backend: `http://localhost:5000/api/v1`.

4.  **Start the Frontend Development Server:**
    ```bash
    npm start
    ```
    The frontend will run on `http://localhost:3000`.

## Usage

### Authentication

*   **Register:** Navigate to `/