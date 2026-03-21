# E-commerce System Architecture

This document outlines the architectural design of the E-commerce solution, focusing on its logical components, data flow, and technologies used.

## 1. High-Level Overview

The system follows a typical **Microservices-oriented architecture (SOA)**, where the backend is an API gateway managing various domain-specific services (or modules within a monolithic backend for this example), and the frontend is a Single-Page Application (SPA). This setup allows for modularity, scalability, and independent deployment of components.

```mermaid
graph TD
    User((User/Browser)) --> |Requests| CDN(CDN/Load Balancer)
    CDN --> |Frontend Assets| SPA(React Frontend)
    SPA --> |API Calls (HTTP/S)| API_LB(API Load Balancer)
    API_LB --> Backend_Service(Node.js/Express Backend Service)

    Backend_Service --> |DB Operations| PostgreSQL(PostgreSQL Database)
    Backend_Service --> |Caching/Sessions| Redis(Redis Cache)
    Backend_Service --> |Logging| LoggingService(Winston/Logging Platform)
    Backend_Service --> |Monitoring| MonitoringService(Prometheus/Grafana)

    SubGraph Other_Services
        Backend_Service --> |Messaging/Events (future)| MessageBroker(Kafka/RabbitMQ)
        MessageBroker --> PaymentService(Payment Service)
        MessageBroker --> InventoryService(Inventory Service)
        MessageBroker --> NotificationService(Notification Service)
    End
```

## 2. Component Breakdown

### 2.1. Frontend (React SPA)

*   **Technology**: React.js, React Router DOM, Axios, Context API, Tailwind CSS.
*   **Responsibility**:
    *   User Interface (UI) and User Experience (UX) rendering.
    *   Client-side routing.
    *   Interaction with the backend API.
    *   Local state management (React Context for authentication, cart).
    *   Form handling and client-side validation.
    *   Storing authentication tokens (JWT) in HTTP-only cookies (via `js-cookie` wrapper) for security.
*   **Structure**:
    *   `src/pages`: Top-level components mapped to routes (e.g., `HomePage`, `ProductDetailPage`, `LoginPage`).
    *   `src/components`: Reusable UI components (e.g., `Header`, `ProductCard`, `CartItem`, forms).
    *   `src/contexts`: Global state management for Authentication and Shopping Cart.
    *   `src/api`: Centralized Axios instances and API service functions for clean separation of concerns.
    *   `src/routes`: Defines application routing logic, including protected routes.
*   **UI/UX**: Utilizes Tailwind CSS for a utility-first approach, enabling rapid, consistent styling and responsive design.

### 2.2. Backend (Node.js / Express.js API)

*   **Technology**: Node.js, Express.js, PostgreSQL (via Knex.js), Redis (via ioredis), JWT, Bcrypt.js, Joi, Winston, Helmet, CORS, Express Rate Limit.
*   **Architectural Pattern**: Follows a modular, layered approach, resembling an **MVC (Model-View-Controller)** pattern but often referred to as **Controller-Service-Repository** or **Controller-Service-Data Access Layer** in API-only applications.
*   **Layers**:
    *   **Routes**: Defines API endpoints and maps them to controllers.
    *   **Controllers**: Handle incoming HTTP requests, validate input (using Joi and a `validate` middleware), call appropriate service methods, and send HTTP responses.
    *   **Services**: Encapsulate the core business logic. They orchestrate data access, perform calculations, and enforce business rules. Services are designed to be reusable and testable independently of the HTTP layer.
    *   **Database (DAL/Models)**: Handled by `knexfile.js` for configuration and direct `knex` calls within services for data interactions. For more complex applications, a dedicated `models` or `repositories` layer would abstract `knex` calls further.
    *   **Middleware**: A collection of functions executed before/after controllers.
        *   `auth.middleware.js`: Handles JWT verification and role-based authorization.
        *   `error.middleware.js`: Centralized error handling, converting operational errors into consistent API responses.
        *   `cache.middleware.js`: Implements Redis caching for read-heavy endpoints (e.g., product listings).
        *   `validate.middleware.js`: Generic middleware for Joi schema validation.
        *   `express-rate-limit`: Prevents abuse by limiting requests from a single IP.
        *   `helmet`, `cors`, `morgan`: Security and logging middlewares.
*   **Modules**: The backend is organized into logical modules (`auth`, `users`, `products`, `cart`, `orders`), each containing its own routes, controllers, and services.
*   **Scalability Considerations**:
    *   **Statelessness**: The API is largely stateless, relying on JWT for authentication, enabling easy horizontal scaling.
    *   **Caching**: Redis is integrated for caching frequently accessed data (e.g., product lists) to reduce database load and improve response times.
    *   **Database**: PostgreSQL is chosen for its robustness, ACID compliance, and scalability. `knex.js` allows for efficient query building.
    *   **Logging**: Structured logging with Winston helps in monitoring and debugging.

## 3. Data Flow Example: Fetching Products

1.  **User Interaction**: A user navigates to the `/products` page on the React frontend.
2.  **Frontend Request**: `ProductList.jsx` uses `productApi.getProducts()` (which uses Axios) to send a `GET /api/v1/products` request to the backend.
3.  **Backend Middleware**:
    *   `express-rate-limit`: Checks if the client's IP is rate-limited.
    *   `morgan`: Logs the incoming request.
    *   `cache.middleware.js`: Checks if the requested product list (based on `req.originalUrl`) is in Redis.
        *   **Cache Hit**: If found, the cached data is returned immediately, skipping further processing.
        *   **Cache Miss**: Proceeds to the next middleware/controller.
4.  **Backend Controller**: `product.controller.js` `getProducts` method receives the request. It extracts query parameters (filters, pagination, sorting options).
5.  **Backend Service**: `product.service.js` `queryProducts` method is called with the extracted parameters.
6.  **Database Interaction**:
    *   `queryProducts` constructs dynamic SQL queries using Knex.js, applying filters, sorting, and pagination.
    *   It executes two queries: one for the total count of matching products and another for the actual paginated product data.
    *   It joins `products` with `categories` to include category names.
7.  **Response Handling (Backend)**:
    *   The service returns the paginated product data and metadata (total pages, total results).
    *   The controller wraps this data in a `success` response and sends it back.
    *   If there was a cache miss, the `cache.middleware.js` intercepts this response and stores it in Redis before sending it to the client.
8.  **Frontend Processing**:
    *   Axios receives the response.
    *   `ProductList.jsx` updates its state with the new product data and pagination info.
    *   React re-renders the `ProductCard` components to display the products.

## 4. Database Schema (PostgreSQL)

The database schema is defined using Knex.js migrations and includes tables for:

*   **`users`**: Stores user information (id, name, email, password, role, timestamps). `email` is unique. `password` is hashed.
*   **`categories`**: Stores product categories (id, name, description, timestamps). `name` is unique.
*   **`products`**: Stores product details (id, name, description, price, stock, categoryId (FK to categories), imageUrl, timestamps). Indexed on `categoryId`, `name`, and `price` for efficient querying.
*   **`cart_items`**: Stores items currently in a user's shopping cart (id, userId (FK), productId (FK), quantity, timestamps). Unique constraint on `(userId, productId)`.
*   **`orders`**: Stores order details (id, userId (FK), totalAmount, shippingAddress, paymentMethod, status, timestamps). Indexed on `userId` and `status`.
*   **`order_items`**: Stores individual items within an order (id, orderId (FK), productId (FK), quantity, price_at_order, timestamps).

## 5. Security Considerations

*   **Authentication**: JWT for API authentication.
*   **Authorization**: Role-based access control (RBAC) implemented via middleware.
*   **Password Hashing**: `bcrypt.js` is used to securely hash passwords.
*   **Input Validation**: Joi schemas for validating all incoming request data.
*   **CORS**: Configured to allow requests only from the specified frontend origin.
*   **HTTP Headers**: `helmet` middleware for setting various security-related HTTP headers.
*   **Rate Limiting**: `express-rate-limit` to prevent brute-force attacks and denial-of-service.
*   **Environment Variables**: Sensitive information (database credentials, JWT secret) is stored in environment variables, not hardcoded.

## 6. Future Enhancements

*   **Microservices Refinement**: Break down the backend modules into truly independent microservices (e.g., `Product Service`, `Order Service`, `User Service`) with an API Gateway.
*   **Payment Gateway Integration**: Implement actual payment processing (Stripe, PayPal, etc.).
*   **Inventory Management**: More sophisticated stock management, possibly with event-driven architecture.
*   **Search Engine**: Integrate with Elasticsearch or Algolia for advanced product search.
*   **Image Uploads**: Cloud storage integration (AWS S3, Cloudinary) for product images.
*   **Real-time Features**: WebSockets for notifications (e.g., order status updates, new messages).
*   **Admin Dashboard**: A more comprehensive admin panel for managing products, orders, users.
*   **Observability**: Enhanced monitoring with Prometheus/Grafana, distributed tracing (Jaeger).
*   **Deployment Automation**: Full CI/CD to Kubernetes or serverless platforms.