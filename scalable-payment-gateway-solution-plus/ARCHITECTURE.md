```markdown
# PayPro: System Architecture Documentation

This document provides a high-level overview of the PayPro system's architecture, outlining its main components, their interactions, and the underlying technologies.

## 1. High-Level Overview

PayPro is a full-stack web application designed to facilitate payment processing for merchants. It comprises a Node.js Express backend API, a React frontend application, and a PostgreSQL database. It integrates with a mock external payment gateway to simulate real-world payment flows.

```mermaid
graph TD
    A[Customer Browser (React App)] <--> B(Load Balancer / Reverse Proxy)
    B <--> C[Backend API (Node.js/Express)]
    C <--> D[PostgreSQL Database]
    C <--> E[Mock Payment Gateway API]
    E --> C
    C -- Logs --> F[Logging Service (e.g., ELK, CloudWatch)]
    C -- Metrics --> G[Monitoring (e.g., Prometheus, Datadog)]
    H[Admin User] -- Manages --> C
    I[Merchant User] -- Manages --> C
```

## 2. Component Breakdown

### 2.1. Frontend Application (Client)

*   **Technology:** React, JavaScript, Tailwind CSS, Axios.
*   **Purpose:** Provides a user-friendly interface for customers to browse products, checkout, and for merchants to manage their products and view transactions. Admin users would have a dedicated dashboard (not fully implemented but envisioned).
*   **Key Features:**
    *   User Authentication (Login, Register).
    *   Public Product Listing.
    *   Merchant Dashboard (Product CRUD, Transaction View).
    *   Checkout Flow.
    *   Client-side routing with React Router.
    *   Global state management (e.g., `AuthContext`).

### 2.2. Backend API (Server)

*   **Technology:** Node.js, Express.js, JavaScript.
*   **Purpose:** Serves as the central brain of the application, exposing RESTful API endpoints for the frontend, handling business logic, data persistence, and integration with external services.
*   **Key Modules/Layers:**
    *   **`server.js` (Entry Point):** Initializes Express, applies global middleware (security, logging, error handling), and mounts routes.
    *   **`config/`:** Centralized application configuration (environment variables, secrets).
    *   **`db/`:** Database connection (`knexfile.js`, `connection.js`), migration scripts, and seed data.
    *   **`middleware/`:**
        *   `auth.js`: JWT verification, role-based access control (RBAC).
        *   `errorHandler.js`: Centralized error handling, converting errors into standardized API responses.
        *   `logger.js`: Winston-based structured logging for API requests and application events.
        *   `cache.js`: `apicache` integration for GET endpoints.
        *   `rateLimit.js`: `express-rate-limit` to prevent abuse.
    *   **`utils/`:** Helper functions (JWT token generation/verification, password hashing, custom error classes, `asyncHandler`, mock payment gateway client).
    *   **`models/`:** Abstraction layer for database interactions (using Knex.js queries). Each model (`User`, `Merchant`, `Product`, `PaymentIntent`, `Transaction`) encapsulates its data structure and basic CRUD operations.
    *   **`services/`:** Contains core business logic. Services interact with models and orchestrate complex operations (e.g., `AuthService` handles registration/login, `PaymentService` orchestrates payment intent creation and external gateway interaction).
    *   **`controllers/`:** Handle incoming HTTP requests, validate input (using Joi), call appropriate services, and send HTTP responses.
    *   **`routes/`:** Defines API endpoints and maps them to controllers, applying relevant middleware (auth, validation).

### 2.3. Database

*   **Technology:** PostgreSQL.
*   **ORM/Query Builder:** Knex.js.
*   **Purpose:** Stores all persistent application data.
*   **Key Tables:**
    *   `users`: Stores user credentials and roles (`admin`, `merchant`, `customer`).
    *   `merchants`: Stores merchant-specific details, linked to a `user_id`.
    *   `products`: Stores product information, linked to a `merchant_id`.
    *   `payment_intents`: Tracks payment attempts, including status and link to external gateway ID.
    *   `transactions`: Records successful (or failed) final transactions, linked to `payment_intent`, `user`, `merchant`, and `product`.

### 2.4. External Services (Mock)

*   **Mock Payment Gateway:**
    *   **Purpose:** Simulates an external payment processing service (e.g., Stripe, PayPal). It takes payment requests, processes them (mocking success/failure), and sends back status updates via a webhook.
    *   **Integration:** The backend's `PaymentService` communicates with this mock gateway.
    *   **Webhook:** The mock gateway calls a `/api/payments/webhook` endpoint on the backend to update `payment_intent` and `transaction` statuses.

## 3. Data Flow Example: Customer Initiates Payment

1.  **Frontend (React):** Customer selects a product and clicks "Pay." The `CheckoutPage` sends a `POST /api/payments/checkout` request with `productId`, `quantity`, and `paymentMethodId` to the backend.
2.  **Backend (Express):**
    *   `paymentRoutes` directs to `paymentController.checkout`.
    *   `authMiddleware` verifies the customer's JWT token and role.
    *   `paymentController` validates input and calls `paymentService.initiatePayment`.
    *   `paymentService`:
        *   Fetches product details, checks stock.
        *   Creates a new `payment_intent` record in the database with `status: 'created'`.
        *   Calls the `mockPaymentGateway.processPayment` utility, passing amount, currency, and the *internal* `payment_intent_id` as metadata.
3.  **Mock Payment Gateway:**
    *   Receives the payment request.
    *   Simulates processing logic (e.g., random success/failure, or logic based on `paymentMethodId`).
    *   Updates its internal state for the payment.
    *   **Crucially:** Calls the backend's `/api/payments/webhook` endpoint with the new status (e.g., `payment_intent.succeeded`).
4.  **Backend (Express - Webhook):**
    *   `paymentRoutes` directs to `paymentController.handleWebhook`.
    *   `paymentController` validates the webhook payload (e.g., checks a shared secret).
    *   Calls `paymentService.updatePaymentStatusFromWebhook`.
    *   `paymentService`:
        *   Looks up the `payment_intent` by the `external_id` (or internal ID passed in metadata).
        *   Updates the `payment_intent` status in the database (e.g., `succeeded`, `failed`).
        *   If `succeeded`, creates a new `transaction` record in the database, linking it to the `payment_intent`, `user`, `merchant`, and `product`.
        *   Updates product stock quantity.
5.  **Backend (Express - Original Checkout Response):**
    *   The `paymentController.checkout` method (from step 2) receives the synchronous result from `mockPaymentGateway.processPayment`.
    *   It then queries the database for the *latest* status of the `payment_intent` and `transaction` (if created).
    *   Sends a response to the frontend indicating the payment outcome.
6.  **Frontend (React):** Receives the response and updates the UI, showing success or failure.

## 4. Scalability Considerations

*   **Stateless Backend:** The Express backend is largely stateless, relying on JWTs for session management, making it easy to scale horizontally.
*   **Database:** PostgreSQL can be scaled vertically (more powerful server) or horizontally (read replicas, sharding) as needed. Knex.js facilitates flexible database interaction.
*   **Caching:** `apicache` helps reduce database load for frequently accessed read-only data.
*   **Rate Limiting:** Protects against API abuse and ensures fair resource distribution.
*   **Microservices (Future):** For extreme scale or complex domain boundaries, the system could be broken down into microservices (e.g., separate services for Authentication, Merchant Management, Product Catalog, Payment Orchestration, Transaction Ledger).

## 5. Security Considerations

*   **Authentication & Authorization:** JWT with strong secret, RBAC.
*   **Password Hashing:** `bcrypt.js` is used to store hashed passwords.
*   **Input Validation:** Joi schemas are used on the backend to validate all incoming API requests.
*   **HTTPS:** Assumed for production environments.
*   **CORS & Helmet:** Used to enhance security by setting appropriate HTTP headers.
*   **Environment Variables:** Sensitive information is stored in environment variables, not hardcoded.
*   **PCI Compliance:** This system *does not directly handle sensitive card data*. It offloads this responsibility to a (mock) external payment gateway, which is critical for real-world PCI DSS compliance.

## 6. Observability

*   **Logging:** Winston provides structured logging, useful for debugging and monitoring in production. Logs can be easily sent to external logging aggregators (e.g., ELK stack, Splunk, cloud-specific services).
*   **Monitoring:** Integration with tools like Prometheus/Grafana or cloud monitoring services (AWS CloudWatch, Azure Monitor) would provide metrics on API response times, error rates, server resource usage, and database performance.
```

#### Deployment Guide