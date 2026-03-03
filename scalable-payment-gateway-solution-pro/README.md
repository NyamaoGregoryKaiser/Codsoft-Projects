# Enterprise Payment Processing System

This project is a comprehensive, production-ready full-stack application for payment processing, built with Node.js (Express) for the backend and React for the frontend, utilizing PostgreSQL as the database. It aims to provide a robust solution for managing user accounts, transactions, and simulated payment gateway interactions.

## Features

**Backend (Node.js/Express):**
*   User Authentication & Authorization (JWT, bcrypt)
*   User Management (CRUD)
*   Account Management (Create, View, Update Balance)
*   Transaction Processing (Deposits, Withdrawals, Transfers)
*   Simulated External Payment Gateway Integration (Charges, Refunds)
*   Robust Error Handling Middleware
*   Logging (Winston)
*   Rate Limiting (Authentication endpoints)
*   Database interaction with Knex.js

**Frontend (React):**
*   User Registration & Login
*   Dashboard displaying account summaries
*   Account management (view, create)
*   Transaction history viewer
*   Payment initiation form (simulated card payments)
*   Context API for state management
*   Basic UI/UX for a responsive application

**Database (PostgreSQL):**
*   Schema definitions for Users, Accounts, Transactions, Payments
*   Knex.js for migrations and seeding
*   Indexes for query optimization

**DevOps & Quality:**
*   Docker and Docker Compose for containerization
*   `.env` based environment configuration
*   CI/CD pipeline configuration using GitHub Actions (tests, build)
*   Unit, Integration, and API tests (Jest, Supertest, React Testing Library)
*   Comprehensive logging and error handling

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18+) and npm
*   Docker and Docker Compose
*   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/payment-processing-system.git
    cd payment-processing-system
    ```

2.  **Create `.env` file:**
    Copy the `.env.example` file to `.env` in the project root and fill in your details.
    ```bash
    cp .env.example .env
    ```
    Ensure `DB_HOST` is `db` when running with Docker Compose.

3.  **Build and Run with Docker Compose:**
    This will build the backend and frontend Docker images, set up the PostgreSQL database, run migrations, seed data, and start all services.
    ```bash
    docker-compose up --build -d
    ```
    Wait for services to start. You can check logs with `docker-compose logs -f`. The `command` in `docker-compose.yml` for the backend ensures migrations and seeds run before the server starts.

4.  **Access the application:**
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:5000/api/v1`

### Running Tests

**Backend Tests:**
*   Ensure your `docker-compose.test.yml` (for the test DB) is set up correctly and the test DB specified in `backend/.env` is accessible.
*   From `backend` directory:
    ```bash
    cd backend
    npm install
    # Start test DB (if not using CI setup)
    # docker-compose -f ../docker-compose.test.yml up -d db
    # npm run migrate # for test DB
    # npm run seed    # for test DB
    npm test
    # npm run test:coverage # For coverage report
    ```

**Frontend Tests:**
*   From `frontend` directory:
    ```bash
    cd frontend
    npm install
    npm test
    ```

## API Documentation

See [docs/api.md](docs/api.md) for detailed API endpoints and usage.

## Architecture Documentation

See [docs/architecture.md](docs/architecture.md) for a high-level overview of the system's design.

## Deployment Guide

See [docs/deployment.md](docs/deployment.md) for steps on deploying this application to a production environment.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)