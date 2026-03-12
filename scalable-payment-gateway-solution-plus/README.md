```markdown
# PayPro: Production-Ready Payment Processing System

PayPro is a comprehensive, enterprise-grade full-stack payment processing system designed to handle merchant management, product listings, customer payments (via a mock gateway), and transaction tracking. It emphasizes a robust backend architecture, a responsive frontend, and includes critical production features like authentication, logging, error handling, caching, and CI/CD.

## Table of Contents

1.  [Features](#features)
2.  [Technologies Used](#technologies-used)
3.  [Project Structure](#project-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Prerequisites](#prerequisites)
    *   [Local Development (Without Docker)](#local-development-without-docker)
    *   [Dockerized Development](#dockerized-development)
5.  [Running the Application](#running-the-application)
6.  [Database Management](#database-management)
7.  [Testing](#testing)
    *   [Backend Tests](#backend-tests)
    *   [Frontend Tests](#frontend-tests)
    *   [Performance Testing (Conceptual)](#performance-testing-conceptual)
8.  [API Documentation](#api-documentation)
9.  [Architecture Documentation](#architecture-documentation)
10. [Deployment Guide](#deployment-guide)
11. [Additional Features](#additional-features)
12. [Contributing](#contributing)
13. [License](#license)

## Features

*   **User Management:** Register and manage users with different roles (Admin, Merchant, Customer).
*   **Authentication & Authorization:** JWT-based authentication, Role-Based Access Control (RBAC).
*   **Merchant Management:** Merchants can register, and their status can be approved by an admin.
*   **Product Management:** Merchants can create, update, and delete products. Customers can browse products.
*   **Payment Processing (Mock):** Integrates with a mock external payment gateway to simulate payment capture and webhooks.
*   **Transaction Tracking:** Comprehensive logging of payment intents and final transactions.
*   **Robust API:** RESTful API with CRUD operations.
*   **Frontend UI:** React-based single-page application for user interaction (login, register, merchant dashboard, product browsing, checkout).
*   **Database:** PostgreSQL with Knex.js for migrations and seeding.
*   **Error Handling:** Centralized, descriptive error handling.
*   **Logging & Monitoring:** Winston for structured server-side logging.
*   **Caching:** API caching for improved performance on read-heavy endpoints.
*   **Rate Limiting:** Protects against abuse and DDoS attacks.
*   **Docker Support:** Containerized setup for easy development and deployment.
*   **CI/CD:** GitHub Actions pipeline for automated testing and deployment.

## Technologies Used

**Backend:**

*   **Node.js**: JavaScript runtime
*   **Express.js**: Web application framework
*   **PostgreSQL**: Relational database
*   **Knex.js**: SQL query builder and ORM
*   **Bcrypt.js**: Password hashing
*   **jsonwebtoken**: JWT authentication
*   **Joi**: Schema validation
*   **Winston**: Logging
*   **Helmet**: Security headers
*   **CORS**: Cross-Origin Resource Sharing
*   **express-rate-limit**: API rate limiting
*   **apicache**: API caching
*   **Axios**: HTTP client (for mock payment gateway)

**Frontend:**

*   **React**: JavaScript library for building user interfaces
*   **React Router DOM**: Declarative routing
*   **Axios**: HTTP client
*   **Tailwind CSS**: Utility-first CSS framework (configured in `client/src/index.css`)

**DevOps & Tools:**

*   **Docker, Docker Compose**: Containerization
*   **GitHub Actions**: CI/CD pipeline
*   **Jest**: JavaScript testing framework
*   **Supertest**: HTTP assertion library for API testing
*   **Nodemon**: Development server auto-reload
*   **ESLint**: Code linting

## Project Structure

```
payment-processor/
├── .github/                     # GitHub Actions workflows
├── client/                      # React Frontend
├── server/                      # Node.js Express Backend
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # API request handlers
│   │   ├── db/                  # Database setup (Knexfile, migrations, seeds)
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # Database interaction abstraction
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   │   └── server.js            # Main Express app entry
│   ├── __tests__/               # Backend tests
├── .dockerignore
├── docker-compose.yml           # Docker orchestration
├── .gitignore
├── ARCHITECTURE.md              # Architecture documentation
├── API_DOCS.md                  # API documentation (OpenAPI outline)
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

## Setup Instructions

### Prerequisites

*   Node.js (v18 or higher)
*   npm (v8 or higher)
*   PostgreSQL (v14 or higher) - can be installed directly or via Docker
*   Git
*   Docker & Docker Compose (if using Dockerized setup)

### Local Development (Without Docker)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/payment-processor.git
    cd payment-processor
    ```

2.  **Set up the Backend:**
    ```bash
    cd server
    npm install
    cp .env.example .env
    ```
    Edit `.env` file:
    *   Set `DATABASE_URL` to your local PostgreSQL instance (e.g., `postgresql://user:password@localhost:5432/payment_processor_db`).
    *   Set `JWT_SECRET` to a strong, random string.

    **Create PostgreSQL Database:**
    ```sql
    CREATE DATABASE payment_processor_db;
    CREATE USER your_user WITH PASSWORD 'your_password';
    GRANT ALL PRIVILEGES ON DATABASE payment_processor_db TO your_user;
    ```
    (Replace `your_user` and `your_password` with what you use in `.env`)

    **Run Migrations and Seeds:**
    ```bash
    npm run migrate:latest
    npm run seed:run
    ```

3.  **Set up the Frontend:**
    ```bash
    cd ../client
    npm install
    cp .env.example .env
    ```
    Edit `.env` file:
    *   `REACT_APP_API_BASE_URL=http://localhost:5000/api`

4.  **Start the applications:**
    *   **Backend:**
        ```bash
        cd ../server
        npm run dev # For development with hot-reloading
        # or `npm start` for production mode
        ```
    *   **Frontend:**
        ```bash
        cd ../client
        npm start
        ```

    The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:5000/api`.

### Dockerized Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/payment-processor.git
    cd payment-processor
    ```

2.  **Create `.env` files:**
    *   `cd server && cp .env.example .env && cd ..`
    *   `cd client && cp .env.example .env && cd ..`

    **Important:** The `docker-compose.yml` file already sets environment variables for the containers, overriding the `.env` files inside the containers. The local `.env` files are primarily for running without Docker or for specific local override values during `docker-compose up` if you use `--env-file`. For this setup, `docker-compose.yml` defines the necessary environment variables directly for backend DB connection etc.

3.  **Build and run Docker containers:**
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Build Docker images for both backend and frontend.
    *   Start a PostgreSQL container.
    *   Start the backend application container (using `npm run dev` for hot-reloading).
    *   Start the frontend application container (using `npm start`).
    *   Automatically connect the backend to the database.

    Give the database a few seconds to initialize. The backend will automatically run migrations when it connects.

    The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:5000/api`.

## Running the Application

After following the setup instructions:

*   **Frontend:** Access `http://localhost:3000` in your browser.
*   **Backend API:** Make requests to `http://localhost:5000/api`.

You can use the seeded users:
*   **Admin:** `admin@paypro.com` / `password123`
*   **Merchant:** `merchant@example.com` / `password123`
*   **Customer:** `customer@example.com` / `password123`

## Database Management

From the `server` directory:

*   **Create a new migration:** `npm run migrate:make <migration_name>`
*   **Run all pending migrations:** `npm run migrate:latest`
*   **Rollback the last batch of migrations:** `npm run migrate:rollback`
*   **Create a new seed file:** `npm run seed:make <seed_name>`
*   **Run all seed files:** `npm run seed:run`

## Testing

### Backend Tests

From the `server` directory:
```bash
npm test
```
This command runs unit and integration tests using Jest and Supertest. It will spin up a separate PostgreSQL container for testing to ensure a clean test environment.

### Frontend Tests

From the `client` directory:
```bash
npm test
```
This command runs frontend unit/component tests using React Testing Library and Jest.

### Performance Testing (Conceptual)

Performance tests are not integrated into the automated CI/CD directly but are crucial for production readiness.
*   **Tools:** `k6`, `JMeter`
*   **Approach:** Scripts for load, stress, and soak tests for critical API endpoints. Monitor server resources (CPU, Memory, DB connections) during tests.
*   An example `k6` script can be found in the [Testing](#testing) section of the full project description.

## API Documentation

Refer to `API_DOCS.md` for a detailed outline of API endpoints, request/response formats, and authentication requirements. This project follows a RESTful design.

## Architecture Documentation

Refer to `ARCHITECTURE.md` for a high-level overview of the system design, components, and data flow.

## Deployment Guide

Refer to `DEPLOYMENT.md` for instructions on deploying this application to a production environment.

## Additional Features

*   **Logging:** Server logs are handled by Winston and written to console/files.
*   **Error Handling:** A global error handling middleware ensures consistent error responses.
*   **Caching:** `apicache` middleware is available and can be applied to `GET` routes for performance.
*   **Rate Limiting:** `express-rate-limit` is applied globally to prevent abuse.
*   **Authentication/Authorization:** JWT for user sessions, role-based access control for API routes.

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Write tests for your changes.
5.  Ensure all tests pass (`npm test` in both `server` and `client` directories).
6.  Ensure code style is consistent (`npm run lint` in `server`).
7.  Commit your changes (`git commit -m 'feat: Add new feature'`).
8.  Push to the branch (`git push origin feature/your-feature-name`).
9.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
```

#### API Documentation (Outline)