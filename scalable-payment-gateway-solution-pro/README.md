```markdown
# Payment Processing System

A comprehensive, production-ready payment processing system built with Spring Boot, PostgreSQL, and modern best practices.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Features](#2-features)
3.  [Architecture](#3-architecture)
4.  [Technology Stack](#4-technology-stack)
5.  [Setup and Local Development](#5-setup-and-local-development)
    *   [Prerequisites](#prerequisites)
    *   [Database Setup](#database-setup)
    *   [Running with Docker Compose](#running-with-docker-compose)
    *   [Running Natively (IDE)](#running-natively-ide)
6.  [API Documentation](#6-api-documentation)
7.  [Authentication & Authorization](#7-authentication--authorization)
8.  [Testing](#8-testing)
9.  [Deployment](#9-deployment)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [Future Enhancements](#11-future-enhancements)
12. [Contributing](#12-contributing)
13. [License](#13-license)

---

### 1. Introduction

This project provides a robust backend for a payment processing system, allowing merchants to initiate, capture, refund, and void payments. It focuses on scalability, security, and maintainability, serving as a solid foundation for enterprise-grade financial applications.

### 2. Features

*   **Merchant Management:** Create, manage, and activate/deactivate merchant accounts.
*   **Payment Processing:**
    *   Initiate `SALE` (immediate capture) or `AUTHORIZE` (reserve funds) payments.
    *   `CAPTURE` previously authorized payments.
    *   `REFUND` captured payments (full or partial).
    *   `VOID` authorized but not yet captured payments.
*   **Transaction Tracking:** Detailed logging of all financial transactions related to payments.
*   **Authentication & Authorization:**
    *   JWT-based authentication for internal users (Admins, Merchant Portal Users).
    *   API Key-based authentication for merchant system-to-system integration (e.g., payment initiation).
    *   Role-Based Access Control (RBAC).
*   **Idempotency:** Prevent duplicate payment processing for repeated requests using `X-Idempotency-Key` header.
*   **Error Handling:** Centralized exception handling with meaningful error responses.
*   **Logging & Monitoring:** Structured logging and Prometheus-compatible metrics for operational visibility.
*   **Caching:** In-memory caching (Caffeine) for frequently accessed data to improve performance.
*   **Rate Limiting:** Protect API endpoints from abuse and ensure system stability.
*   **Database Migrations:** Managed schema evolution using Flyway.
*   **Comprehensive Testing:** Unit, Integration, and API tests to ensure quality and reliability.
*   **Containerization:** Docker support for easy deployment and local development.
*   **CI/CD:** Basic GitHub Actions workflow for automated build, test, and deployment to a development environment.

### 3. Architecture

The system is designed as a modular monolith, making it easy to understand and deploy initially, while being structured to allow for future decomposition into microservices if scaling requirements demand it.

*   **Backend:** Spring Boot application exposing RESTful APIs.
*   **Database:** PostgreSQL for persistent storage.
*   **External Payment Gateway:** (Simulated) Integration layer for communication with third-party payment service providers (PSPs).
*   **Authentication:** Spring Security handles JWT and API Key validation.

[More detailed architecture can be found in `ARCHITECTURE.md`](ARCHITECTURE.md)

### 4. Technology Stack

*   **Backend:** Java 17, Spring Boot 3, Spring Data JPA, Spring Security, Lombok, Jackson
*   **Database:** PostgreSQL
*   **Build Tool:** Maven
*   **Containerization:** Docker, Docker Compose
*   **API Documentation:** Springdoc-OpenAPI (Swagger UI)
*   **Database Migrations:** Flyway
*   **Testing:** JUnit 5, Mockito, Spring Boot Test, Testcontainers
*   **Caching:** Caffeine
*   **Rate Limiting:** Resilience4j
*   **Logging:** SLF4J + Logback

### 5. Setup and Local Development

#### Prerequisites

*   Java 17 JDK
*   Maven 3.8+
*   Docker & Docker Compose (recommended)
*   Git

#### Database Setup (Manual if not using Docker Compose)

1.  **Install PostgreSQL:** Follow instructions for your OS.
2.  **Create Database:**
    ```sql
    CREATE DATABASE payment_processor;
    CREATE USER payment_user WITH PASSWORD 'payment_password';
    GRANT ALL PRIVILEGES ON DATABASE payment_processor TO payment_user;
    ```
3.  **Run Flyway Migrations:**
    ```bash
    # Ensure application.yml points to your local DB
    mvn flyway:migrate
    ```

#### Running with Docker Compose (Recommended)

This sets up PostgreSQL and the Spring Boot application.

1.  **Build Docker Image:**
    ```bash
    docker build -t payment-processor-app -f docker/Dockerfile .
    ```
    *Alternatively, `docker-compose up --build` will build it implicitly.*

2.  **Start Services:**
    ```bash
    docker-compose up --build
    ```
    This will:
    *   Start a PostgreSQL container (`db`).
    *   Build and start the `payment-processor-app` container (`app`).
    *   Apply Flyway migrations automatically on startup (configured in `application.yml`).

    The application will be accessible at `http://localhost:8080`.

3.  **Stop Services:**
    ```bash
    docker-compose down
    ```

#### Running Natively (IDE)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/payment-processor.git
    cd payment-processor
    ```
2.  **Configure `application.yml`:**
    Adjust `spring.datasource.url`, `username`, and `password` to match your local PostgreSQL setup.
3.  **Run Migrations:**
    ```bash
    mvn flyway:migrate
    ```
4.  **Run the application:**
    From your IDE (e.g., IntelliJ IDEA, Eclipse), run the `PaymentProcessorApplication.java` class.
    Alternatively, using Maven:
    ```bash
    mvn spring-boot:run
    ```

### 6. API Documentation

The API documentation is generated using Springdoc-OpenAPI and can be accessed via Swagger UI.

*   **Swagger UI:** `http://localhost:8080/swagger-ui.html`
*   **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

Use the Swagger UI to interact with the API endpoints. You'll need to authenticate using either a Bearer Token (for `ADMIN`/`MERCHANT_USER` endpoints) or the `X-API-Key` header (for `/api/v1/merchants/{merchantId}/payments` endpoints).

### 7. Authentication & Authorization

The system employs two main authentication mechanisms:

1.  **JWT (JSON Web Token) for Users:**
    *   Used for authenticating `ADMIN` and `MERCHANT_USER` roles, typically from a UI portal.
    *   Login at `/api/v1/auth/login` to get a JWT token.
    *   Include the token in the `Authorization` header: `Bearer <your_jwt_token>`.
2.  **API Key for Merchants:**
    *   Used by external merchant systems to interact with payment processing endpoints.
    *   Each `Merchant` has a unique `api_key`.
    *   Include the key in the `X-API-Key` header: `X-API-Key: <your_merchant_api_key>`.
    *   Example merchant API key from `V2__seed_data.sql`: `test_api_key_123`

**Seed Data for Testing:**
*   **Admin User:** `username: admin`, `password: adminpassword`
*   **Merchant User:** `username: merchuserA`, `password: merchantpassword`
*   **Test Merchant API Key:** `test_api_key_123` (for merchant with ID `4e21d6e1-9128-4b72-911b-7489e2c608a0`)

### 8. Testing

The project is covered by various types of tests:

*   **Unit Tests:** Located in `src/test/java/...` for individual components (services, utilities). Run with `mvn test`.
*   **Integration Tests:** Use Spring Boot's testing capabilities and Testcontainers to spin up a real PostgreSQL database for integration testing. These ensure components work together. Run with `mvn verify`.
*   **API Tests:** (Conceptual, often done with Postman/Newman or REST Assured) Ensure external API contract is met.
*   **Performance Tests:** (Conceptual, typically with JMeter or Gatling) Validate system performance under load.

**To run all tests:**
```bash
mvn clean verify
```

### 9. Deployment

The application is containerized using Docker, enabling consistent deployment across different environments.

*   **Local Deployment:** Covered in [Running with Docker Compose](#running-with-docker-compose).
*   **CI/CD:** A GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automates build, test, and deployment to a development environment.
*   **Production Deployment:** For production, consider orchestrators like Kubernetes or cloud services like AWS ECS/EKS, Google Cloud Run/GKE, or Azure AKS/App Services.
    *   Ensure environment variables (`DB_HOST`, `DB_USER`, `JWT_SECRET`, etc.) are securely managed (e.g., Kubernetes Secrets, AWS Secrets Manager).
    *   A sample `DEPLOYMENT.md` is provided for further details.

### 10. Monitoring & Logging

*   **Logging:** Structured logging is configured via `logback-spring.xml`. Logs are output to console and a rolling file. JSON logging can be enabled for consumption by tools like ELK stack (Elasticsearch, Logstash, Kibana) or Splunk.
*   **Monitoring:** Spring Boot Actuator exposes various health and metrics endpoints:
    *   Health Check: `http://localhost:8080/actuator/health`
    *   Metrics (Prometheus format): `http://localhost:8080/actuator/prometheus`
    Integrate with Prometheus for metrics collection and Grafana for dashboard visualization.

### 11. Future Enhancements

*   **External PSP Integration:** Replace the `ExternalPaymentGatewayService` mock with actual SDKs or API calls to payment gateways (e.g., Stripe, Adyen).
*   **Asynchronous Processing:** Use message queues (Kafka, RabbitMQ) for non-critical operations (e.g., fraud checks, notifications, ledger updates) to improve responsiveness.
*   **Fraud Detection:** Integrate with a fraud detection system.
*   **Webhooks:** Implement webhooks to notify merchants of payment status changes.
*   **Advanced Reporting:** Develop comprehensive reporting tools for financial reconciliation.
*   **Vaulting/Tokenization:** Securely store card data via tokenization services (PCI DSS compliance).
*   **Multi-currency Support:** Extend currency handling and exchange rate management.
*   **Admin UI:** Build a dedicated UI for administrators to manage merchants, users, and view system health.
*   **Frontend Application:** Develop a merchant portal UI (e.g., with React, Angular, Vue) to consume the backend APIs.
*   **Circuit Breakers/Retry:** Implement more advanced resilience patterns using Resilience4j or Hystrix.

### 12. Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### 13. License

This project is licensed under the MIT License.
```