```markdown
# Payment Processing System - API Documentation

This document provides a high-level overview of the RESTful APIs exposed by the Payment Processing System.
For a complete, interactive API documentation, please refer to the auto-generated Swagger UI:

**Swagger UI Link:** `http://localhost:8080/swagger-ui.html`

## Base URL

`http://localhost:8080/api/v1`

## Authentication

All API endpoints, except `/auth/login`, require authentication.
Depending on the endpoint, either a **JWT Bearer Token** or an **X-API-Key** is required.

*   **JWT Bearer Token:**
    *   Obtain by logging in to `/auth/login`.
    *   Include in `Authorization` header: `Authorization: Bearer <YOUR_JWT_TOKEN>`
*   **X-API-Key:**
    *   Issued to merchants for system-to-system integration.
    *   Include in header: `X-API-Key: <YOUR_MERCHANT_API_KEY>`

## Endpoints Summary

### 1. Authentication Endpoints (`/auth`)

*   **`POST /auth/login`**
    *   **Description:** Authenticates a user (admin or merchant portal user) and returns a JWT token.
    *   **Request Body:** `AuthRequest` (username, password)
    *   **Response Body:** `AuthResponse` (token, username, roles)
    *   **Authentication:** None (public endpoint)

### 2. Merchant Endpoints (`/merchants`)

*(Access typically for ADMIN or MERCHANT_USER with appropriate permissions)*

*   **`POST /merchants`**
    *   **Description:** Creates a new merchant account.
    *   **Authentication:** JWT (ADMIN)
*   **`GET /merchants/{merchantId}`**
    *   **Description:** Retrieves details of a specific merchant.
    *   **Authentication:** JWT (ADMIN, or MERCHANT_USER for their own merchant)
*   **`PUT /merchants/{merchantId}`**
    *   **Description:** Updates an existing merchant account.
    *   **Authentication:** JWT (ADMIN, or MERCHANT_USER for their own merchant)
*   **`GET /merchants`**
    *   **Description:** Retrieves a list of all merchants.
    *   **Authentication:** JWT (ADMIN)

### 3. Payment Endpoints (`/merchants/{merchantId}/payments`)

*(Access primarily for merchant systems using API Keys)*

*   **`POST /merchants/{merchantId}/payments`**
    *   **Description:** Initiates a new payment transaction (SALE or AUTHORIZE).
    *   **Headers:** `X-API-Key`, `X-Idempotency-Key` (required for idempotency)
    *   **Request Body:** `PaymentRequest` (externalId, amount, currency, type, card details, description)
    *   **Response Body:** `PaymentResponse`
    *   **Authentication:** X-API-Key (MERCHANT_API)
*   **`POST /merchants/{merchantId}/payments/{paymentId}/capture`**
    *   **Description:** Captures funds for a previously authorized payment.
    *   **Authentication:** X-API-Key (MERCHANT_API)
*   **`POST /merchants/{merchantId}/payments/{paymentId}/refund`**
    *   **Description:** Refunds a captured payment (full or partial).
    *   **Query Params:** `amount` (BigDecimal)
    *   **Authentication:** X-API-Key (MERCHANT_API)
*   **`POST /merchants/{merchantId}/payments/{paymentId}/void`**
    *   **Description:** Voids a previously authorized payment that has not yet been captured.
    *   **Authentication:** X-API-Key (MERCHANT_API)
*   **`GET /merchants/{merchantId}/payments/{paymentId}`**
    *   **Description:** Retrieves details of a specific payment.
    *   **Authentication:** JWT (ADMIN, MERCHANT_USER) or X-API-Key (MERCHANT_API)
*   **`GET /merchants/{merchantId}/payments`**
    *   **Description:** Retrieves a list of all payments for a specific merchant.
    *   **Authentication:** JWT (ADMIN, MERCHANT_USER) or X-API-Key (MERCHANT_API)

### 4. Transaction Endpoints (`/merchants/{merchantId}/transactions` or `/payments/{paymentId}/transactions`)

*(Access typically for ADMIN or MERCHANT_USER with appropriate permissions)*

*   **`GET /merchants/{merchantId}/transactions`**
    *   **Description:** Retrieves all transactions for a specific merchant.
    *   **Authentication:** JWT (ADMIN, MERCHANT_USER)
*   **`GET /payments/{paymentId}/transactions`**
    *   **Description:** Retrieves all transactions related to a specific payment.
    *   **Authentication:** JWT (ADMIN, MERCHANT_USER)

---

**Note:** This is a summary. For exact request/response schemas, error codes, and detailed descriptions, please use the interactive Swagger UI.
```