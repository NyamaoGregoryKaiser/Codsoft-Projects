# Web Scraping Tools System - Architecture Documentation

## 1. Introduction
This document outlines the architecture of the Web Scraping Tools System, a full-stack application designed to allow users to define, schedule, execute, and manage web scraping jobs. The system provides a robust backend for data processing and storage, and a user-friendly frontend for interaction.

## 2. High-Level Architecture
The system follows a typical client-server architecture, comprising a React-based frontend, a Node.js/Express.js backend, and a PostgreSQL database. Scraping tasks are performed by a dedicated worker within the backend process, leveraging Puppeteer for browser automation.

```mermaid
graph TD
    A[User Browser (React Frontend)] -- HTTP Requests --> B(Nginx/Load Balancer - Optional)
    B -- Proxies --> C(Node.js Backend / Express API)
    C -- Connects --> D[PostgreSQL Database]
    C -- Triggers/Manages --> E(Scraping Worker)
    E -- Controls --> F(Headless Browser - Puppeteer)
    F -- Scrapes Data From --> G[Target Websites]
    E -- Stores Data In --> D
    C -- Fetches Data From --> D
```

## 3. Component Breakdown

### 3.1. Frontend (React.js Application)
*   **Purpose:** Provides the user interface for managing scraping jobs, viewing results, and user authentication.
*   **Technologies:** React.js, React Router DOM, Axios.
*   **Key Modules:**
    *   **Authentication Module:** Handles user registration, login, logout, and token management.
    *   **Job Management Module:** Allows users to create, view, edit, delete, and manually trigger scraping jobs.
    *   **Result Viewer Module:** Displays the data scraped by executed jobs.
    *   **API Client:** A layer for making HTTP requests to the backend API.
    *   **UI Components:** Reusable components for forms, tables, navigation, etc.

### 3.2. Backend (Node.js/Express.js API)
*   **Purpose:** Exposes RESTful API endpoints, handles business logic, orchestrates scraping tasks, manages data persistence, and provides authentication/authorization.
*   **Technologies:** Node.js, Express.js, Prisma ORM, PostgreSQL, Puppeteer, JWT, Bcrypt, `node-cron`, `winston`, `joi`, `express-rate-limit`, `node-cache`.
*   **Key Modules:**
    *   **API Controllers (`/src/api`):** Define the entry points for HTTP requests, validate input, and delegate to services.
    *   **Services (`/src/services`):** Encapsulate business logic and interact with the database (via Prisma) and other modules (like the scraper). Examples: `AuthService`, `JobService`, `ResultService`.
    *   **Database Layer (`/src/database`):**
        *   **Prisma Schema:** Defines the database models (`User`, `ScrapingJob`, `ScrapingResult`).
        *   **Prisma Client:** Generated ORM for interacting with PostgreSQL.
        *   **Migrations:** Manages database schema changes.
    *   **Authentication Module (`/src/auth`):** Handles user authentication (login, registration) and authorization (middleware for JWT verification, role-based access).
    *   **Scraper Module (`/src/scraper`):**
        *   **`ScraperService`:** Core logic for launching Puppeteer, navigating to URLs, applying CSS selectors, and extracting data.
        *   **`ScrapingWorker`:** A background process (or async function) that executes scraping jobs, manages their lifecycle (scheduling, error handling), and stores results. Uses `node-cron` for scheduling.
    *   **Middleware (`/src/middleware`):**
        *   **Error Handling:** Catches and standardizes API errors.
        *   **Logging:** Records application events and errors (`winston`).
        *   **Rate Limiting:** Protects API endpoints from abuse.
        *   **Caching:** In-memory cache (`node-cache`) for frequently accessed data (e.g., user profiles).
    *   **Configuration (`/src/config`):** Manages environment variables and application settings (`dotenv`).
    *   **Tests (`/src/tests`):** Unit, integration, and API tests using Jest and Supertest.

### 3.3. Database (PostgreSQL)
*   **Purpose:** Persistently stores all application data, including user accounts, scraping job definitions, and scraped results.
*   **Technology:** PostgreSQL.
*   **Schema:**
    *   `User`: Stores user credentials and roles.
    *   `ScrapingJob`: Stores the definition of each scraping task (URL, selectors, schedule).
    *   `ScrapingResult`: Stores the data extracted from each successful scraping run.

## 4. Data Flow
1.  **User Interaction:** A user interacts with the React frontend to create or manage a scraping job.
2.  **API Request:** The frontend sends an authenticated HTTP request to the Node.js backend API (e.g., `POST /api/jobs`).
3.  **Backend Processing:**
    *   The request passes through middleware (authentication, rate limiting, logging).
    *   The API controller validates the input (Joi).
    *   A service (`JobService`) handles the business logic, interacts with the Prisma ORM to persist the job definition in PostgreSQL.
    *   If a job is created/updated with a schedule, the `ScrapingWorker` registers/updates its `node-cron` task.
4.  **Scraping Execution:**
    *   At the scheduled time (or manual trigger), the `ScrapingWorker` picks up a job.
    *   It launches a headless browser instance using Puppeteer.
    *   Puppeteer navigates to the target URL, executes JavaScript if necessary, and extracts data based on the defined CSS selectors.
    *   Any errors during scraping are logged.
    *   The extracted data (or error information) is formatted and stored as a `ScrapingResult` in the PostgreSQL database via Prisma.
5.  **Data Retrieval:** When the user wants to view job details or results, the frontend makes a `GET` request to the backend. The backend fetches the relevant data from PostgreSQL and returns it.

## 5. Security Considerations
*   **Authentication:** JWT-based authentication for all API endpoints.
*   **Authorization:** Role-based access control (e.g., only authenticated users can create jobs).
*   **Input Validation:** Strict validation of all incoming API requests to prevent injection attacks and malformed data.
*   **Password Hashing:** Bcrypt is used to securely hash user passwords.
*   **Environment Variables:** Sensitive information (database credentials, JWT secret) stored in environment variables.
*   **Rate Limiting:** To prevent brute-force attacks and resource exhaustion.

## 6. Scalability and Reliability
*   **Stateless Backend:** The Node.js API is designed to be stateless, allowing for easy horizontal scaling.
*   **Database:** PostgreSQL is a robust and scalable relational database.
*   **Scraping Worker:** While currently integrated, the scraping worker can be separated into a distinct microservice or utilize a message queue (e.g., RabbitMQ, Kafka) and multiple worker instances for higher throughput and resilience.
*   **Caching:** In-memory caching provides a performance boost for frequently accessed static data. For large-scale production, Redis would be used.

## 7. Future Enhancements
*   **Distributed Scraping:** Integrate with a message queue and multiple worker instances for parallel processing and fault tolerance.
*   **Proxy Integration:** Support for rotating proxies to avoid IP blocking.
*   **Captcha Solving:** Integration with CAPTCHA solving services.
*   **Advanced Scheduling:** More granular control over job scheduling.
*   **Webhooks/Notifications:** Notify users upon job completion or failure.
*   **Dashboard Analytics:** Visualizations for scraped data and job performance.
*   **Multi-tenant Architecture:** Support for multiple isolated organizations/users.