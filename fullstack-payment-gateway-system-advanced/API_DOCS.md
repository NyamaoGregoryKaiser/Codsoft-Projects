```markdown
# Payment Processor System - API Documentation

This document provides a high-level overview of the API endpoints for the Payment Processor System. For interactive and up-to-date API documentation, please refer to the auto-generated Swagger UI or ReDoc provided by FastAPI.

*   **Swagger UI:** `http://localhost:8000/docs`
*   **ReDoc:** `http://localhost:8000/redoc`

---

## Base URL

`http://localhost:8000` (for local development)

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

`Authorization: Bearer <access_token>`

Access tokens are obtained via the `/auth/token` endpoint.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register/merchant`
Registers a new merchant user and creates an associated merchant entity.
*   **Request Body (`schemas.auth.MerchantUserCreate`):**
    ```json
    {
      "email": "merchant_user@example.com",
      "password": "strong_password",
      "merchant_name": "My Awesome Store"
    }
    ```
*   **Response (`schemas.merchant.MerchantRead`):**
    ```json
    {
      "id": 1,
      "name": "My Awesome Store",
      "api_key": "generated-api-key-uuid",
      "is_active": true,
      "user_id": 1,
      "created_at": "2023-01-01T12:00:00+00:00",
      "updated_at": "2023-01-01T12:00:00+00:00",
      "user": {
        "id": 1,
        "email": "merchant_user@example.com",
        "role": "merchant",
        "is_active": true,
        "created_at": "2023-01-01T12:00:00+00:00",
        "updated_at": "2023-01-01T12:00:00+00:00"
      }
    }
    ```
*   **Status Codes:** `201 Created`, `409 Conflict` (email already exists)

### `POST /auth/token`
Obtains JWT access and refresh tokens.
*   **Request Body (form data):**
    *   `username`: User's email.
    *   `password`: User's password.
*   **Response (`schemas.auth.Token`):**
    ```json
    {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "bearer"
    }
    ```
*   **Status Codes:** `200 OK`, `401 Unauthorized`

### `POST /auth/refresh`
Refreshes an expired access token using a refresh token.
*   **Request Body (`schemas.auth.TokenRefresh`):**
    ```json
    {
      "refresh_token": "eyJ..."
    }
    ```
*   **Response (`schemas.auth.Token`):**
    ```json
    {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "bearer"
    }
    ```
*   **Status Codes:** `200 OK`, `401 Unauthorized`

## 2. Merchant Endpoints (`/merchants`)

### `GET /merchants/me`
Retrieves details of the authenticated merchant.
*   **Requires:** Merchant role.
*   **Response (`schemas.merchant.MerchantRead`):** (Same as register response, but for the logged-in merchant)
*   **Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

### `PATCH /merchants/me`
Updates details of the authenticated merchant.
*   **Requires:** Merchant role.
*   **Request Body (`schemas.merchant.MerchantUpdate`):**
    ```json
    {
      "name": "Updated Store Name"
    }
    ```
*   **Response (`schemas.merchant.MerchantRead`):**
*   **Status Codes:** `200 OK`, `401 Unauthorized`, `403 Forbidden`

## 3. Customer Endpoints (`/customers`)

### `POST /customers`
Creates a new customer for the authenticated merchant.
*   **Requires:** Merchant role.
*   **Request Body (`schemas.customer.CustomerCreate`):**
    ```json
    {
      "external_id": "customer_123",
      "email": "john.doe@example.com",
      "name": "John Doe"
    }
    ```
*   **Response (`schemas.customer.CustomerRead`):**
    ```json
    {
      "id": 1,
      "merchant_id": 1,
      "external_id": "customer_123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "created_at": "2023-01-01T12:00:00+00:00",
      "updated_at": "2023-01-01T12:00:00+00:00"
    }
    ```
*   **Status Codes:** `201 Created`, `409 Conflict` (customer with external_id already exists for merchant)

### `GET /customers/{customer_id}`
Retrieves a customer by ID.
*   **Requires:** Merchant role.
*   **Response (`schemas.customer.CustomerRead`):**
*   **Status Codes:** `200 OK`, `404 Not Found`

### `GET /customers`
Lists all customers for the authenticated merchant.
*   **Requires:** Merchant role.
*   **Query Parameters:** `skip`, `limit`
*   **Response (`List[schemas.customer.CustomerRead]`):**
*   **Status Codes:** `200 OK`

## 4. Payment Endpoints (`/payments`)

### `POST /payments/methods`
Adds a new payment method (tokenized card) for a customer.
*   **Requires:** Merchant role.
*   **Request Body (`schemas.payment.PaymentMethodCreate`):**
    ```json
    {
      "customer_id": 1,
      "type": "credit_card",
      "token": "tok_visa", # This would come from client-side tokenization with a real gateway
      "last4": "4242",
      "brand": "Visa",
      "expiry_month": 12,
      "expiry_year": 2025,
      "is_default": true
    }
    ```
*   **Response (`schemas.payment.PaymentMethodRead`):**
    ```json
    {
      "id": 1,
      "customer_id": 1,
      "type": "credit_card",
      "token": "tok_visa",
      "last4": "4242",
      "brand": "Visa",
      "expiry_month": 12,
      "expiry_year": 2025,
      "is_default": true,
      "created_at": "2023-01-01T12:00:00+00:00",
      "updated_at": "2023-01-01T12:00:00+00:00"
    }
    ```
*   **Status Codes:** `201 Created`

### `POST /payments/charge`
Initiates a payment charge (authorization and capture).
*   **Requires:** Merchant role.
*   **Request Body (`schemas.transaction.TransactionCreate`):**
    ```json
    {
      "customer_id": 1,
      "payment_method_id": 1,
      "amount": 100.50,
      "currency": "USD",
      "description": "Purchase of goods",
      "idempotency_key": "unique-request-id-123"
    }
    ```
*   **Response (`schemas.transaction.TransactionRead`):**
    ```json
    {
      "id": 1,
      "uuid": "unique-request-id-123",
      "merchant_id": 1,
      "customer_id": 1,
      "payment_method_id": 1,
      "amount": "100.50",
      "currency": "USD",
      "status": "captured",
      "description": "Purchase of goods",
      "external_transaction_id": "ext_txn_12345",
      "created_at": "2023-01-01T12:00:00+00:00",
      "updated_at": "2023-01-01T12:00:00+00:00"
    }
    ```
*   **Status Codes:** `201 Created`, `200 OK` (if idempotent request already processed), `400 Bad Request`, `402 Payment Required`, `503 Service Unavailable`

### `POST /payments/transactions/{transaction_uuid}/capture`
Captures an previously authorized transaction.
*   **Requires:** Merchant role.
*   **Path Parameter:** `transaction_uuid`
*   **Request Body (`schemas.transaction.TransactionAction`):**
    ```json
    {
      "amount": 50.00 # Optional, if partial capture is allowed
    }
    ```
*   **Response (`schemas.transaction.TransactionRead`):**
*   **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `POST /payments/transactions/{transaction_uuid}/refund`
Refunds a captured transaction.
*   **Requires:** Merchant role.
*   **Path Parameter:** `transaction_uuid`
*   **Request Body (`schemas.transaction.TransactionAction`):**
    ```json
    {
      "amount": 25.00 # Optional, if partial refund is allowed
    }
    ```
*   **Response (`schemas.transaction.TransactionRead`):**
*   **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `GET /payments/transactions/{transaction_uuid}`
Retrieves a transaction by its UUID.
*   **Requires:** Merchant role.
*   **Path Parameter:** `transaction_uuid`
*   **Response (`schemas.transaction.TransactionRead`):**
*   **Status Codes:** `200 OK`, `404 Not Found`

### `GET /payments/transactions`
Lists all transactions for the authenticated merchant.
*   **Requires:** Merchant role.
*   **Query Parameters:** `status`, `customer_id`, `skip`, `limit`
*   **Response (`List[schemas.transaction.TransactionRead]`):**
*   **Status Codes:** `200 OK`

## 5. Webhook Endpoints (`/webhooks`)

### `POST /webhooks/gateway-events`
**Internal/Gateway-facing endpoint:** Receives asynchronous events from the external payment gateway.
*   **Does NOT require authentication (but needs secret validation in a real system).**
*   **Request Body (`schemas.webhook.GatewayWebhookEvent`):**
    ```json
    {
      "id": "evt_abc123",
      "type": "charge.succeeded",
      "data": {
        "object": {
          "id": "ext_txn_12345",
          "amount": 10050,
          "currency": "usd",
          "status": "succeeded",
          "metadata": {
            "our_transaction_uuid": "unique-request-id-123"
          }
        }
      }
    }
    ```
*   **Response:** `200 OK` (FastAPI processes in background)
*   **Status Codes:** `200 OK`, `400 Bad Request`

### `POST /webhooks/merchant-configs`
Registers/updates a merchant's webhook endpoint for receiving notifications.
*   **Requires:** Merchant role.
*   **Request Body (`schemas.webhook.MerchantWebhookConfigCreate`):**
    ```json
    {
      "url": "https://your-merchant-app.com/webhook-receiver",
      "secret": "your-webhook-secret", # For verifying webhook payloads
      "events": ["transaction.succeeded", "transaction.failed"]
    }
    ```
*   **Response (`schemas.webhook.MerchantWebhookConfigRead`):** (Shows updated config)
*   **Status Codes:** `200 OK`, `201 Created`

---

This overview is a starting point. Refer to the Swagger UI (`/docs`) for the most accurate and interactive documentation, including all request/response schemas and available parameters.
```