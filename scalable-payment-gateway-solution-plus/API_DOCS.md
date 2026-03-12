```markdown
# PayPro API Documentation

This document outlines the RESTful API endpoints for the PayPro payment processing system.

**Base URL:** `http://localhost:5000/api` (or your deployed backend URL)

---

## Authentication

All protected routes require a JSON Web Token (JWT) in the `Authorization` header, formatted as `Bearer <token>`.

### 1. User Authentication & Registration

*   **`POST /auth/register`**
    *   **Description:** Registers a new user. If `role` is `merchant`, `merchantName` is also required.
    *   **Request Body (Customer):**
        ```json
        {
          "email": "customer@example.com",
          "password": "strongpassword",
          "firstName": "John",
          "lastName": "Doe",
          "role": "customer"
        }
        ```
    *   **Request Body (Merchant):**
        ```json
        {
          "email": "merchant@example.com",
          "password": "strongpassword",
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "merchant",
          "merchantName": "Jane's Emporium"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
          "message": "User registered successfully",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": {
            "id": "uuid-...",
            "email": "...",
            "role": "...",
            "firstName": "...",
            "lastName": "..."
          },
          "merchant": { // Only if role is merchant
            "id": "uuid-...",
            "name": "...",
            "status": "pending"
          }
        }
        ```
    *   **Error (400 Bad Request):** Validation error or user already exists.
        ```json
        {
          "message": "User with this email already exists."
        }
        ```

*   **`POST /auth/login`**
    *   **Description:** Authenticates a user and returns a JWT.
    *   **Request Body:**
        ```json
        {
          "email": "user@example.com",
          "password": "strongpassword"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "message": "Logged in successfully",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": {
            "id": "uuid-...",
            "email": "...",
            "role": "...",
            "firstName": "...",
            "lastName": "..."
          }
        }
        ```
    *   **Error (401 Unauthorized):** Invalid credentials.
        ```json
        {
          "message": "Invalid credentials."
        }
        ```

---

### 2. User & Profile Management

*   **`GET /users/me`**
    *   **Description:** Retrieves the authenticated user's profile.
    *   **Authorization:** `Bearer <token>` (Any authenticated user)
    *   **Response (200 OK):**
        ```json
        {
          "id": "uuid-...",
          "email": "...",
          "first_name": "...",
          "last_name": "...",
          "role": "...",
          "created_at": "...",
          "updated_at": "..."
        }
        ```
    *   **Error (401 Unauthorized):** Invalid/missing token.

*   **`PUT /users/me`**
    *   **Description:** Updates the authenticated user's profile.
    *   **Authorization:** `Bearer <token>` (Any authenticated user)
    *   **Request Body:** (Partial update allowed)
        ```json
        {
          "firstName": "Updated John",
          "lastName": "Doe"
        }
        ```
    *   **Response (200 OK):** Updated user object.
    *   **Error (400 Bad Request):** Validation error.

---

### 3. Merchant Management

*   **`GET /merchants`**
    *   **Description:** Get all merchants. (Admin only)
    *   **Authorization:** `Bearer <token>` (Role: `admin`)
    *   **Query Parameters:**
        *   `status`: (optional) Filter by merchant status (`pending`, `approved`, `rejected`).
    *   **Response (200 OK):**
        ```json
        [
          {
            "id": "uuid-...",
            "user_id": "uuid-...",
            "name": "...",
            "status": "...",
            "website_url": "...",
            // ... other merchant details
          }
        ]
        ```

*   **`GET /merchants/:id`**
    *   **Description:** Get a single merchant by ID. (Admin/Owner)
    *   **Authorization:** `Bearer <token>` (Role: `admin` or `merchant` if ID matches `user_id`)
    *   **Response (200 OK):** Single merchant object.

*   **`PUT /merchants/:id/status`**
    *   **Description:** Update a merchant's status. (Admin only)
    *   **Authorization:** `Bearer <token>` (Role: `admin`)
    *   **Request Body:**
        ```json
        {
          "status": "approved"
        }
        ```
    *   **Response (200 OK):** Updated merchant object.

---

### 4. Product Management

*   **`GET /products`**
    *   **Description:** Get a list of all active products.
    *   **Authorization:** (Optional) If authenticated, may show additional details.
    *   **Query Parameters:**
        *   `merchantId`: (optional) Filter by specific merchant.
        *   `search`: (optional) Full-text search on product name/description.
        *   `page`, `limit`: (optional) Pagination.
    *   **Response (200 OK):**
        ```json
        [
          {
            "id": "uuid-...",
            "merchant_id": "uuid-...",
            "name": "...",
            "description": "...",
            "price": "99.99",
            "currency": "USD",
            "stock_quantity": 100,
            "is_active": true
          }
        ]
        ```
    *   **Caching:** This endpoint is a good candidate for caching (`apicache`).

*   **`GET /products/:id`**
    *   **Description:** Get a single product by ID.
    *   **Authorization:** (Optional)
    *   **Response (200 OK):** Single product object.

*   **`POST /merchants/:merchantId/products`**
    *   **Description:** Create a new product for a specific merchant.
    *   **Authorization:** `Bearer <token>` (Role: `merchant`, `merchantId` must match authenticated user's merchant ID)
    *   **Request Body:**
        ```json
        {
          "name": "New Awesome Product",
          "description": "This product is truly awesome.",
          "price": 49.99,
          "currency": "USD",
          "stockQuantity": 50,
          "imageUrl": "https://example.com/image.jpg",
          "isActive": true
        }
        ```
    *   **Response (201 Created):** Created product object.

*   **`PUT /merchants/:merchantId/products/:productId`**
    *   **Description:** Update an existing product.
    *   **Authorization:** `Bearer <token>` (Role: `merchant`, `merchantId` must match, and product must belong to merchant)
    *   **Request Body:** (Partial update allowed)
        ```json
        {
          "price": 39.99,
          "stockQuantity": 45
        }
        ```
    *   **Response (200 OK):** Updated product object.

*   **`DELETE /merchants/:merchantId/products/:productId`**
    *   **Description:** Delete a product.
    *   **Authorization:** `Bearer <token>` (Role: `merchant`, `merchantId` must match, and product must belong to merchant)
    *   **Response (204 No Content):** Successfully deleted.

---

### 5. Payments

This section describes interaction with our internal payment intent and transaction tracking. Actual payment processing is handled by a mock external gateway.

*   **`POST /payments/checkout`**
    *   **Description:** Initiates a payment for a product. Creates a `payment_intent` and interacts with the mock gateway.
    *   **Authorization:** `Bearer <token>` (Role: `customer`)
    *   **Request Body:**
        ```json
        {
          "productId": "uuid-of-product",
          "quantity": 1,
          "paymentMethodId": "mock_pm_card_visa" // Mock payment method ID
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "message": "Payment intent created and processed successfully",
          "paymentIntent": {
            "id": "uuid-...",
            "external_id": "mock_pi_...",
            "status": "succeeded", // Or 'pending', 'failed'
            "amount": "...",
            "currency": "...",
            // ... other payment intent details
          },
          "transaction": { // Only if payment succeeded immediately
            "id": "uuid-...",
            "status": "completed",
            "amount": "...",
            // ... other transaction details
          }
        }
        ```

*   **`POST /payments/webhook`**
    *   **Description:** (Internal/Mock Gateway Endpoint) Receives updates from the mock payment gateway regarding payment status changes. **Do NOT expose directly to public.**
    *   **Authorization:** (Can be secured via a shared secret or IP whitelist for production webhooks)
    *   **Request Body (Example from mock gateway):**
        ```json
        {
          "event": "payment_intent.succeeded",
          "data": {
            "id": "mock_pi_...", // External ID
            "status": "succeeded",
            "amount": 10000, // in cents
            "currency": "usd",
            "metadata": {
              "paymentIntentId": "internal_payment_intent_uuid" // Our internal ID
            }
          }
        }
        ```
    *   **Response (200 OK):** Acknowledges receipt of webhook.

---

### 6. Transaction Reporting

*   **`GET /transactions`**
    *   **Description:** Retrieves a list of transactions.
    *   **Authorization:** `Bearer <token>` (Role: `admin` can see all, `merchant` can see their own)
    *   **Query Parameters:**
        *   `merchantId`: (optional, for admin) Filter by merchant.
        *   `userId`: (optional, for admin) Filter by customer.
        *   `status`: (optional) Filter by transaction status (`completed`, `failed`, `refunded`, `disputed`).
        *   `type`: (optional) Filter by transaction type (`sale`, `refund`, `chargeback`).
        *   `startDate`, `endDate`: (optional) Date range filtering.
        *   `page`, `limit`: (optional) Pagination.
    *   **Response (200 OK):**
        ```json
        [
          {
            "id": "uuid-...",
            "payment_intent_id": "uuid-...",
            "user_id": "uuid-...",
            "merchant_id": "uuid-...",
            "product_id": "uuid-...",
            "amount": "99.99",
            "currency": "USD",
            "type": "sale",
            "status": "completed",
            "created_at": "..."
          }
        ]
        ```

*   **`GET /transactions/:id`**
    *   **Description:** Get a single transaction by ID.
    *   **Authorization:** `Bearer <token>` (Role: `admin` or `merchant` if transaction belongs to them or `customer` if transaction belongs to them)
    *   **Response (200 OK):** Single transaction object.
```

#### Architecture Documentation