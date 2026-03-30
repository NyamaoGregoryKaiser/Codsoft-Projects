```markdown
# API Documentation

This document describes the RESTful API endpoints for the Payment Processing System. All endpoints are prefixed with `/api/v1`.

## Base URL

`http://localhost:3000/api/v1` (for local development)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token.

**Header:** `Authorization: Bearer <your_jwt_token>`

## Error Responses

Errors are returned in a consistent JSON format:

```json
{
  "message": "Error description",
  "status": 400,
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

Common status codes:
*   `400 Bad Request`: Invalid input data (validation errors).
*   `401 Unauthorized`: Authentication required or invalid token.
*   `403 Forbidden`: Authenticated, but no permission to access the resource.
*   `404 Not Found`: Resource not found.
*   `500 Internal Server Error`: Server-side error.

---

## 1. Authentication Endpoints

### `POST /auth/register`

Register a new user (admin or merchant).

*   **Role:** Public
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123",
      "role": "MERCHANT" # Optional, defaults to "MERCHANT". Can be "ADMIN" or "MERCHANT".
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "User registered successfully",
          "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "MERCHANT"
          }
        }
        ```
    *   `400 Bad Request`: If email exists or validation fails.

### `POST /auth/login`

Authenticate a user and receive a JWT.

*   **Role:** Public
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "message": "Logged in successfully",
          "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "MERCHANT"
          },
          "token": "your.jwt.token.here"
        }
        ```
    *   `401 Unauthorized`: Invalid credentials.

### `GET /auth/me`

Get the profile of the authenticated user.

*   **Role:** Authenticated (Admin, Merchant)
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "MERCHANT",
            "merchantId": "uuid" # Present if user is a merchant
          }
        }
        ```
    *   `401 Unauthorized`: No token or invalid token.

---

## 2. Merchant Endpoints

### `POST /merchants`

Create a new merchant account. (Typically done by an Admin, or automatically linked on merchant user registration).

*   **Role:** Admin
*   **Request Body:**
    ```json
    {
      "name": "New Merchant Co.",
      "contactEmail": "contact@newmerchant.com",
      "ownerUserId": "uuid-of-an-existing-merchant-user"
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "Merchant created successfully",
          "merchant": {
            "id": "uuid",
            "name": "New Merchant Co.",
            "apiKey": "generated-uuid",
            "isActive": true
          }
        }
        ```
    *   `400 Bad Request`: Validation error.
    *   `403 Forbidden`: Not an admin.

### `GET /merchants`

Get a list of all merchant accounts.

*   **Role:** Admin
*   **Responses:**
    *   `200 OK`:
        ```json
        [
          { "id": "uuid1", "name": "Acme Corp", ... },
          { "id": "uuid2", "name": "New Merchant Co.", ... }
        ]
        ```

### `GET /merchants/:id`

Get details of a specific merchant account.

*   **Role:** Admin, or Merchant (if `id` matches their own merchant ID)
*   **Parameters:**
    *   `id` (path): Merchant UUID.
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "id": "uuid",
          "name": "Acme Corp",
          "apiKey": "uuid",
          "isActive": true,
          "contactEmail": "contact@acmecorp.com",
          "ownerUser": { "id": "uuid", "email": "merchant@acme.com", "role": "MERCHANT" },
          "createdAt": "...",
          "updatedAt": "..."
        }
        ```
    *   `404 Not Found`: Merchant not found.
    *   `403 Forbidden`: Unauthorized.

### `PUT /merchants/:id`

Update details of a specific merchant account.

*   **Role:** Admin, or Merchant (if `id` matches their own merchant ID)
*   **Parameters:**
    *   `id` (path): Merchant UUID.
*   **Request Body:** (Partial update allowed)
    ```json
    {
      "name": "Updated Merchant Name",
      "isActive": false,
      "contactEmail": "newcontact@updatedmerchant.com"
    }
    ```
*   **Responses:**
    *   `200 OK`: Updated merchant object.
    *   `400 Bad Request`: Validation error.
    *   `404 Not Found`: Merchant not found.
    *   `403 Forbidden`: Unauthorized.

### `DELETE /merchants/:id`

Delete a merchant account.

*   **Role:** Admin
*   **Parameters:**
    *   `id` (path): Merchant UUID.
*   **Responses:**
    *   `204 No Content`: Merchant deleted successfully.
    *   `404 Not Found`: Merchant not found.
    *   `403 Forbidden`: Not an admin.

---

## 3. Payment Endpoints

### `POST /payments/initiate`

Initiate a new payment transaction. This creates a `PENDING` transaction and typically returns a link or token for the customer to complete the payment.

*   **Role:** Merchant
*   **Request Body:**
    ```json
    {
      "amount": 100.50,
      "currency": "USD",
      "description": "Order #12345",
      "customerId": "customer-abc-123", # Optional, merchant's internal customer ID
      "callbackUrl": "https://merchant.com/my-webhook-listener" # Optional, specific webhook URL for this transaction
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "Payment initiated successfully",
          "transactionId": "uuid",
          "status": "PENDING",
          "paymentUrl": "/payments/uuid/process" # Placeholder, in real world would be gateway URL
        }
        ```
    *   `400 Bad Request`: Validation error or invalid amount/currency.
    *   `403 Forbidden`: Not a merchant.

### `POST /payments/callback`

**Internal/Gateway Callback:** Endpoint for the payment gateway (or internal system simulating it) to inform the system about the final status of a payment. This endpoint is typically secured via IP whitelisting or shared secrets, not JWT.

*   **Role:** Internal/System (no authentication for this example, rely on IP/secret in production)
*   **Request Body:**
    ```json
    {
      "transactionId": "uuid-of-initiated-payment",
      "status": "SUCCESS", # or "FAILED"
      "gatewayReference": "ref-from-payment-gateway", # Optional, unique ID from the gateway
      "amount": 100.50, # Optional, confirmed amount from gateway
      "currency": "USD" # Optional, confirmed currency from gateway
    }
    ```
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "message": "Payment callback processed. Transaction uuid status: SUCCESS",
          "transactionId": "uuid",
          "status": "SUCCESS"
        }
        ```
    *   `400 Bad Request`: Missing data, invalid status.
    *   `404 Not Found`: Transaction ID not found.

### `POST /payments/gateway-webhook`

**External Gateway Webhook:** Endpoint to receive webhooks directly from third-party payment gateways (e.g., Stripe, PayPal). The payload structure will depend on the gateway. Signature verification middleware would be essential here.

*   **Role:** Public (secured by gateway's signature verification)
*   **Request Body:** Varies by gateway. Example:
    ```json
    {
      "eventType": "payment.succeeded",
      "data": {
        "transactionId": "our-internal-transaction-uuid",
        "gatewayReference": "gw_charge_abc123",
        "amount": 10050,
        "currency": "usd"
        // ... more gateway specific data
      }
    }
    ```
*   **Responses:**
    *   `200 OK`: `{ "received": true }` (Standard response for most webhooks)

### `GET /payments/:id`

Retrieve details of a specific transaction.

*   **Role:** Admin, or Merchant (only for their own transactions)
*   **Parameters:**
    *   `id` (path): Transaction UUID.
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "id": "uuid",
          "amount": 100.50,
          "currency": "USD",
          "description": "Order #12345",
          "status": "SUCCESS",
          "type": "SALE",
          "gatewayReference": "ref-from-payment-gateway",
          "customerIdentifier": "customer-abc-123",
          "processedAt": "2023-10-27T10:05:00.000Z",
          "createdAt": "...",
          "updatedAt": "...",
          "merchant": { "id": "uuid", "name": "Acme Corp" },
          "refunds": [ /* array of refund objects */ ]
        }
        ```
    *   `404 Not Found`: Transaction not found.
    *   `403 Forbidden`: Unauthorized to view this transaction.

### `POST /payments/:id/refunds`

Initiate a refund for a successful transaction.

*   **Role:** Merchant
*   **Parameters:**
    *   `id` (path): Transaction UUID to refund.
*   **Request Body:**
    ```json
    {
      "amount": 50.00 # Amount to refund. Must be positive and not exceed remaining refundable amount.
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "Refund initiated successfully",
          "refundId": "uuid",
          "status": "PENDING"
        }
        ```
    *   `400 Bad Request`: Invalid amount, transaction not refundable, or already fully refunded.
    *   `404 Not Found`: Transaction not found.
    *   `403 Forbidden`: Not a merchant or unauthorized to refund this transaction.

---

## 4. Webhook Endpoints

### `POST /webhooks/subscriptions`

Create a new webhook subscription for a merchant.

*   **Role:** Merchant
*   **Request Body:**
    ```json
    {
      "eventType": "payment.succeeded", # or "payment.failed", "refund.succeeded", etc.
      "targetUrl": "https://merchant.com/my-payment-webhook-receiver"
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "Webhook subscription created",
          "subscription": {
            "id": "uuid",
            "eventType": "payment.succeeded",
            "targetUrl": "https://merchant.com/my-payment-webhook-receiver"
          }
        }
        ```
    *   `400 Bad Request`: Validation error.
    *   `403 Forbidden`: Not a merchant.

### `GET /webhooks/subscriptions`

Get all webhook subscriptions for the authenticated merchant.

*   **Role:** Merchant
*   **Responses:**
    *   `200 OK`:
        ```json
        [
          { "id": "uuid1", "eventType": "payment.succeeded", "targetUrl": "..." },
          { "id": "uuid2", "eventType": "refund.succeeded", "targetUrl": "..." }
        ]
        ```
    *   `403 Forbidden`: Not a merchant.

### `DELETE /webhooks/subscriptions/:id`

Delete a specific webhook subscription.

*   **Role:** Merchant
*   **Parameters:**
    *   `id` (path): Webhook subscription UUID.
*   **Responses:**
    *   `204 No Content`: Subscription deleted.
    *   `404 Not Found`: Subscription not found.
    *   `403 Forbidden`: Not a merchant or not their subscription.

### `GET /webhooks/admin/subscriptions`

(Admin-only) Get all webhook subscriptions across all merchants.

*   **Role:** Admin
*   **Responses:**
    *   `200 OK`: Array of all webhook subscriptions.
    *   `403 Forbidden`: Not an admin.

---

## 5. User Endpoints

(Primarily for Admin to manage users beyond initial registration)

### `GET /users`

Get a list of all users.

*   **Role:** Admin
*   **Responses:**
    *   `200 OK`: Array of user objects.
    *   `403 Forbidden`: Not an admin.

### `GET /users/:id`

Get details of a specific user.

*   **Role:** Admin
*   **Parameters:**
    *   `id` (path): User UUID.
*   **Responses:**
    *   `200 OK`: User object.
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: Not an admin.

### `PUT /users/:id`

Update details of a specific user.

*   **Role:** Admin
*   **Parameters:**
    *   `id` (path): User UUID.
*   **Request Body:** (Partial update allowed)
    ```json
    {
      "email": "updated@example.com",
      "role": "ADMIN"
    }
    ```
*   **Responses:**
    *   `200 OK`: Updated user object.
    *   `400 Bad Request`: Validation error.
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: Not an admin.

### `DELETE /users/:id`

Delete a user.

*   **Role:** Admin
*   **Parameters:**
    *   `id` (path): User UUID.
*   **Responses:**
    *   `204 No Content`: User deleted successfully.
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: Not an admin.

---
```