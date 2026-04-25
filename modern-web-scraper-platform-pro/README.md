```markdown
# Enterprise Web Scraping Tools System

This is a comprehensive, production-ready web scraping tools system built as a full-stack JavaScript application. It provides a robust backend for managing scraping jobs, storing data, and handling authentication, along with a responsive React frontend for user interaction.

## Features

*   **User Management:** Register, login, manage user accounts with role-based access control (admin/user).
*   **Website Management:** Define and manage target websites to scrape.
*   **Scraping Job Management:**
    *   Create, view, update, and delete scraping jobs.
    *   Define complex scraping rules using CSS selectors (for single elements or lists).
    *   Schedule jobs using cron expressions.
    *   Manually trigger jobs.
    *   Monitor job status (pending, running, completed, failed, stopped) and view detailed logs.
*   **Scraped Data Storage & Viewing:** Automatically store scraped data in a PostgreSQL database and view it through the frontend with filtering capabilities.
*   **Authentication & Authorization:** Secure API with JWT tokens and role-based access control.
*   **Robust Error Handling:** Centralized error handling middleware.
*   **Logging & Monitoring:** Structured logging for backend operations and job execution.
*   **Caching Layer:** In-memory caching for frequently accessed data (e.g., website lists) to improve performance.
*   **Rate Limiting:** Protect the API from abuse.
*   **Scalable Scraping:** Utilizes Puppeteer for dynamic content scraping and Cheerio for efficient static content parsing.
*   **Database:** PostgreSQL with Sequelize ORM for schema management, migrations, and seeding.
*   **Testing:** Comprehensive unit, integration, and API tests.
*   **Deployment:** Dockerized application for easy setup and deployment.
*   **CI/CD:** Basic GitHub Actions workflow for automated testing and building.

## Architecture

The system follows a typical client-server architecture:

*   **Frontend (React.js):**
    *   Single Page Application (SPA) providing a user-friendly interface for managing scraping tasks.
    *   Communicates with the backend via RESTful API calls.
    *   Uses `react-router-dom` for navigation, `axios` for API requests, and `react-toastify` for notifications.
*   **Backend (Node.js/Express.js):**
    *   RESTful API server responsible for:
        *   User authentication and authorization.
        *   CRUD operations for websites, scraping jobs, and scraped data.
        *   Orchestrating scraping tasks (using `scraper.service`).
        *   Scheduling scraping jobs (using `node-cron`).
        *   Storing and retrieving data from PostgreSQL.
    *   Key modules: `controllers`, `services`, `models`, `middleware`, `routes`, `config`, `utils`.
*   **Database (PostgreSQL):**
    *   Relational database storing user information, website configurations, scraping job details, and the actual scraped data.
    *   Managed by `Sequelize` ORM for object-relational mapping, migrations, and seeding.

```mermaid
graph TD
    A[User/Browser] -->|HTTP/S Requests| B(React Frontend)
    B -->|API Calls (JWT Auth)| C(Node.js/Express Backend)
    C -->|Database Queries (Sequelize)| D(PostgreSQL Database)
    C -->|Trigger Scraping| E(Puppeteer/Cheerio Scraper)
    E -->|Scrapes Data from| F(Target Websites)
    F -->|Returns HTML/JSON| E
    E -->|Stores Data & Logs| D
    C --o|Scheduled Jobs (node-cron)| C
    C --o|Logs & Monitoring (Winston)| G(Logger/Monitoring System)
    C --o|Cache (Node-cache)| H(In-memory Cache)
```

## Getting Started

### Prerequisites

*   Git
*   Docker & Docker Compose (recommended for easy setup)
*   Node.js (v18+) and npm/yarn (if running locally without Docker)
*   PostgreSQL (if running locally without Docker)

### Installation (Docker Compose - Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/web-scraper-system.git
    cd web-scraper-system
    ```

2.  **Create `.env` files:**
    Copy the example environment variables for both backend and frontend.

    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
    Edit these files to configure your database, JWT secret, etc. Ensure `REACT_APP_API_BASE_URL` in `frontend/.env` points to your backend (e.g., `http://localhost:5000/api/v1`).

3.  **Build and start the services:**
    This will build the Docker images for both frontend and backend, start PostgreSQL, and run the applications. It also handles database migrations and seeding.
    ```bash
    docker-compose up --build -d
    ```

4.  **Verify services:**
    ```bash
    docker-compose ps
    ```
    You should see `db`, `backend` and `frontend` services running.

5.  **Access the application:**
    *   **Frontend:** `http://localhost:3000` (or the port specified in `frontend/.env`)
    *   **Backend API:** `http://localhost:5000/api/v1` (or the port specified in `backend/.env`)
    *   **API Documentation (Swagger):** `http://localhost:5000/api-docs`

### Installation (Local - Without Docker)

**1. Backend Setup:**

```bash
cd backend
npm install # or yarn install

# Create .env from .env.example and configure PostgreSQL connection details
cp .env.example .env

# Start PostgreSQL server (if not already running)
# Ensure your PostgreSQL user and database match .env settings

# Run database migrations
npm run migrate

# Seed initial data (admin user, example websites, jobs)
npm run seed

# Start the backend server
npm run dev # for development with nodemon
# or
npm start   # for production
```

**2. Frontend Setup:**

```bash
cd frontend
npm install # or yarn install

# Create .env from .env.example
cp .env.example .env

# Ensure REACT_APP_API_BASE_URL points to your backend (e.g., http://localhost:5000/api/v1)

# Start the frontend development server
npm start
```
Frontend will typically open at `http://localhost:3000`.

### Initial Login Credentials

After seeding the database, you can log in with:
*   **Admin User:**
    *   Email: `admin@example.com`
    *   Password: `password123`
*   **Regular User:**
    *   Email: `user@example.com`
    *   Password: `password123`

## API Documentation (Swagger/OpenAPI)

The backend includes auto-generated API documentation using `swagger-jsdoc` and `swagger-ui-express`.
Once the backend is running, navigate to: `http://localhost:5000/api-docs` to explore all available endpoints, their request/response schemas, and even test them directly.

## Deployment Guide

### Production Build

For production deployment, you'd typically build both the frontend and backend Docker images. The provided `Dockerfile` already handles a multi-stage build:

1.  **Build Docker Image:**
    ```bash
    docker build -t your-registry/web-scraper-app:latest .
    ```
    Replace `your-registry` with your Docker registry (e.g., Docker Hub username, AWS ECR, etc.).

2.  **Push to Registry (Optional):**
    ```bash
    docker push your-registry/web-scraper-app:latest
    ```

### Deployment Strategy

*   **Kubernetes (K8s):** For enterprise-grade scaling and orchestration, deploy the `backend`, `frontend` (as a static file server if not bundled), and `db` as separate microservices within a Kubernetes cluster. Use `Deployment` objects for the applications, `Service` objects for exposing them, and `PersistentVolume` for the database.
*   **Cloud Platforms (AWS, Azure, GCP):**
    *   **Backend:** Use services like AWS ECS/EKS, Azure App Service/AKS, GCP Cloud Run/GKE.
    *   **Frontend:** Host as static files on AWS S3 + CloudFront, Azure Static Web Apps, GCP Firebase Hosting.
    *   **Database:** Use managed database services like AWS RDS (PostgreSQL), Azure Database for PostgreSQL, GCP Cloud SQL (PostgreSQL).
*   **VPS/VM (e.g., DigitalOcean, Linode):** Use Docker Compose for a simpler deployment on a single server, or orchestrate with tools like Ansible/Chef for multi-server setups. Ensure robust monitoring and backup solutions.

**Key considerations for Production:**
*   **Environment Variables:** Use a secure method for managing secrets (e.g., Kubernetes Secrets, AWS Secrets Manager, Azure Key Vault).
*   **HTTPS:** Always use SSL/TLS for all communication (e.g., via Nginx/Caddy reverse proxy, Cloudflare, or cloud load balancers).
*   **Scalability:** Configure auto-scaling for your backend services based on load.
*   **Monitoring & Alerting:** Integrate with monitoring tools (Prometheus, Grafana, Datadog) to track application health, performance, and scraping job status. Set up alerts for failures.
*   **Backups:** Regularly back up your PostgreSQL database.
*   **Resource Limits:** Define CPU/memory limits for containers in production environments.
*   **Headless Chrome Management:** For Puppeteer, ensure sufficient resources and consider using a dedicated service for managing browser instances (e.g., Browserless, or a custom cluster of Chrome instances) if you expect high concurrent scraping loads.

## Testing

The project includes unit, integration, and API tests to ensure quality and reliability.

*   **Backend Tests:**
    *   Run all backend tests: `cd backend && npm test`
    *   Run tests in watch mode: `cd backend && npm run test:watch`
    *   Tests are written with `Jest` and `Supertest` for API endpoints.
*   **Frontend Tests:**
    *   Run all frontend tests: `cd frontend && npm test`
    *   Tests are written with `Jest` and `React Testing Library`.

## CI/CD

A basic GitHub Actions workflow (`.github/workflows/main.yml`) is provided. This workflow automatically:
1.  Checks out the code.
2.  Sets up Node.js.
3.  Starts a PostgreSQL service for testing.
4.  Installs backend dependencies.
5.  Runs backend database migrations and seeds the test database.
6.  Executes backend unit, integration, and API tests.
7.  Installs frontend dependencies.
8.  Executes frontend tests.
9.  Builds the frontend for production.
10. Performs a Docker build of the entire application.

This ensures that every push or pull request to the `main` or `develop` branch is automatically validated. For full CI/CD, you would extend this to push Docker images to a registry and trigger deployments to your chosen environment (e.g., Kubernetes, AWS ECS).

---

## Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch for your feature (`git checkout -b feature/your-feature-name`).
3.  Make your changes and write tests.
4.  Ensure all tests pass (`npm test` in both backend and frontend).
5.  Commit your changes (`git commit -am 'feat: Add new feature X'`).
6.  Push to the branch (`git push origin feature/your-feature-name`).
7.  Create a new Pull Request.

---

## License

This project is licensed under the ISC License. See the `LICENSE` file for details. (Note: A `LICENSE` file should be created separately).
```