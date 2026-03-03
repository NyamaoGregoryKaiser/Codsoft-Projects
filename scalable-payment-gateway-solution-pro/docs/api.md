# Payment Processing System API Documentation

Base URL: `/api/v1`

---

## Authentication

### `POST /auth/register`
Registers a new user.
*   **Body:**
    ```json
    {
        "firstName": "string",
        "lastName": "string",
        "email": "string (email format)",
        "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "user": {
            "id": 1,
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "role": "user",
            "createdAt": "2023-11-29T12:00:00.000Z",
            "updatedAt": "2023-11-29T12:00:00.000Z"
        },
        "tokens": {
            "access": {
                "token": "jwt_access_token",
                "expires": "2023-11-29T12:30:00.000Z"
            },
            "refresh": {
                "token": "jwt_refresh_token",
                "expires": "2023-12-06T12:00:00.000Z"
            }
        }
    }
    ```
*   **Errors:** `400 Bad Request` (Invalid input, email already taken)

### `POST /auth/login`
Authenticates a user and provides JWT tokens.
*   **Body:**
    ```json
    {
        "email": "string (email format)",
        "password": "string"
    }
    ```
*   **Response (200 OK):** Same as register response, but for an existing user.
*   **Errors:** `401 Unauthorized` (Incorrect email or password), `429 Too Many Requests` (Rate limited)

---

## Accounts

Requires `Authorization: Bearer <access_token>` header.

### `POST /accounts`
Creates a new account for the authenticated user.
*   **Body:**
    ```json
    {
        "currency": "string (e.g., 'USD', 'EUR')"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "id": 1,
        "user_id": 1,
        "account_number": "ACC-TEST-USD-123",
        "balance": "0.00",
        "currency": "USD",
        "createdAt": "2023-11-29T12:00:00.000Z",
        "updatedAt": "2023-11-29T12:00:00.000Z"
    }
    ```
*   **Errors:** `400 Bad Request` (Account with currency already exists), `401 Unauthorized`

### `GET /accounts`
Retrieves all accounts for the authenticated user.
*   **Response (200 OK):**
    ```json
    [
        { "id": 1, "user_id": 1, "account_number": "ACC-TEST-USD-123", "balance": "100.00", "currency": "USD", ... },
        { "id": 2, "user_id": 1, "account_number": "ACC-TEST-EUR-456", "balance": "50.00", "currency": "EUR", ... }
    ]
    ```
*   **Errors:** `401 Unauthorized`

### `GET /accounts/:accountId`
Retrieves a specific account by ID for the authenticated user.
*   **Parameters:** `accountId` (integer)
*   **Response (200 OK):**
    ```json
    {
        "id": 1,
        "user_id": 1,
        "account_number": "ACC-TEST-USD-123",
        "balance": "100.00",
        "currency": "USD",
        "createdAt": "2023-11-29T12:00:00.000Z",
        "updatedAt": "2023-11-29T12:00:00.000Z"
    }
    ```
*   **Errors:** `401 Unauthorized`, `404 Not Found` (Account not found or not owned by user)

---

## Transactions

Requires `Authorization: Bearer <access_token>` header.

### `POST /transactions/transfer`
Initiates a transfer between two accounts owned by the authenticated user.
*   **Body:**
    ```json
    {
        "fromAccountId": "integer",
        "toAccountId": "integer",
        "amount": "number (positive)",
        "description": "string (optional)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "id": 1,
        "user_id": 1,
        "from_account_id": 1,
        "to_account_id": 2,
        "amount": "100.00",
        "currency": "USD",
        "type": "transfer",
        "status": "completed",
        "description": "Transfer from ACC-123 to ACC-456",
        "createdAt": "2023-11-29T12:00:00.000Z",
        "updatedAt": "2023-11-29T12:00:00.000Z"
    }
    ```
*   **Errors:** `400 Bad Request` (Insufficient funds, currency mismatch), `404 Not Found`, `401 Unauthorized`

### `POST /transactions/deposit`
Records a deposit to an account. (Simulated external deposit or internal admin action.)
*   **Body:**
    ```json
    {
        "accountId": "integer",
        "amount": "number (positive)",
        "description": "string (optional)"
    }
    ```
*   **Response (201 Created):** Same structure as other transactions.
*   **Errors:** `400 Bad Request`, `404 Not Found`, `401 Unauthorized`

### `POST /transactions/withdrawal`
Records a withdrawal from an account. (Simulated external withdrawal or internal admin action.)
*   **Body:**
    ```json
    {
        "accountId": "integer",
        "amount": "number (positive)",
        "description": "string (optional)"
    }
    ```
*   **Response (201 Created):** Same structure as other transactions.
*   **Errors:** `400 Bad Request` (Insufficient funds), `404 Not Found`, `401 Unauthorized`

### `GET /transactions/account/:accountId`
Retrieves transaction history for a specific account owned by the authenticated user.
*   **Parameters:** `accountId` (integer)
*   **Query Parameters:**
    *   `limit`: `integer` (default: 10)
    *   `page`: `integer` (default: 1)
    *   `sortBy`: `string` (e.g., `createdAt:desc`, `amount:asc`)
*   **Response (200 OK):**
    ```json
    {
        "results": [
            { "id": 1, "user_id": 1, "from_account_id": null, "to_account_id": 1, "amount": "500.00", "currency": "USD", "type": "deposit", "status": "completed", "description": "Payment from gateway", "createdAt": "2023-11-29T12:00:00.000Z", ... }
        ],
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "totalResults": 1
    }
    ```
*   **Errors:** `401 Unauthorized`, `404 Not Found`

---

## Payments (Simulated Gateway)

Requires `Authorization: Bearer <access_token>` header.

### `POST /payments`
Initiates a new payment (e.g., charge from a credit card) to deposit funds into a user's account via a simulated external gateway.
*   **Body:**
    ```json
    {
        "accountId": "integer",
        "amount": "number (positive)",
        "currency": "string (e.g., 'USD', 'EUR')",
        "cardDetails": {
            "cardNumber": "string",
            "expiryDate": "string",
            "cvv": "string",
            "cardHolderName": "string"
        }
    }
    ```
    *Note: In a real system, card details would be tokenized client-side and never sent directly to your backend.*
*   **Response (201 Created):**
    ```json
    {
        "id": 1,
        "user_id": 1,
        "account_id": 1,
        "amount": "100.00",
        "currency": "USD",
        "gateway_transaction_id": "gtw_1701331200000_abcde",
        "status": "completed",
        "gateway_response": {
            "gatewayTransactionId": "gtw_1701331200000_abcde",
            "status": "succeeded",
            "message": "Payment processed successfully by simulated gateway"
        },
        "type": "charge",
        "createdAt": "2023-11-29T12:00:00.000Z",
        "updatedAt": "2023-11-29T12:00:00.000Z"
    }
    ```
*   **Errors:** `400 Bad Request` (Missing details, payment gateway failure), `401 Unauthorized`

### `GET /payments/:paymentId`
Retrieves details for a specific payment made by the authenticated user.
*   **Parameters:** `paymentId` (integer)
*   **Response (200 OK):** Same structure as `POST /payments` response.
*   **Errors:** `401 Unauthorized`, `404 Not Found`

### `GET /payments`
Retrieves all payments made by the authenticated user.
*   **Response (200 OK):** An array of payment objects.
*   **Errors:** `401 Unauthorized`