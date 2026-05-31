```markdown
# Zenith Payments API Documentation

This document describes the RESTful API endpoints for the Zenith Payments system.

Base URL: `http://localhost:8080` (or your deployed server URL)

---

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token.

**Header Example:**
`Authorization: Bearer <YOUR_JWT_TOKEN>`

### `POST /auth/login`

Authenticates a user and returns a JWT.

-   **Description**: Logs in a user with their email and password.
-   **Method**: `POST`
-   **Endpoint**: `/auth/login`
-   **Request Body (`application/json`)**:
    ```json
    {
      "email": "john.doe@example.com",
      "password": "Password123!"
    }
    ```
-   **Success Response (`200 OK`, `application/json`)**:
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "address": "456 Main St, Anytown",
        "phoneNumber": "555-2222",
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z",
        "role": "customer"
      }
    }
    ```
-   **Error Responses (`application/json`)**:
    -   `400 Bad Request`: Invalid JSON body or missing fields.
        ```json
        { "message": "Invalid JSON body or missing fields." }
        ```
    -   `401 Unauthorized`: Invalid credentials.
        ```json
        { "message": "Invalid credentials" }
        ```
    -   `500 Internal Server Error`: Server error during processing.
        ```json
        { "message": "Server error during login." }
        ```

### `POST /auth/register`

Registers a new user account.

-   **Description**: Creates a new user in the system.
-   **Method**: `POST`
-   **Endpoint**: `/auth/register`
-   **Request Body (`application/json`)**:
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "StrongPassword123!",
      "fullName": "New User",
      "address": "100 New User Ave",
      "phoneNumber": "555-4444",
      "role": "customer"  // Optional, defaults to "customer"
    }
    ```
-   **Success Response (`201 Created`, `application/json`)**:
    ```json
    {
      "message": "User registered successfully",
      "userId": 2
    }
    ```
-   **Error Responses (`application/json`)**:
    -   `400 Bad Request`: Invalid JSON body or missing fields.
    -   `409 Conflict`: User with provided email or username already exists.
        ```json
        { "message": "User with this email already exists." }
        ```
    -   `500 Internal Server Error`: Server error during registration.

---

## User Endpoints (Protected)

These endpoints require a valid JWT.

### `GET /users/me`

Retrieves the profile of the authenticated user.

-   **Description**: Fetches details of the user associated with the provided JWT.
-   **Method**: `GET`
-   **Endpoint**: `/users/me`
-   **Authorization**: Bearer Token
-   **Success Response (`200 OK`, `application/json`)**:
    ```json
    {
      "id": 1,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "address": "456 Main St, Anytown",
      "phoneNumber": "555-2222",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z",
      "role": "customer"
    }
    ```
-   **Error Responses (`application/json`)**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `404 Not Found`: Authenticated user ID not found (should ideally not happen with valid token).
    -   `500 Internal Server Error`: Server error.

### `GET /admin/users`

Retrieves a list of all users in the system. (Admin Only)

-   **Description**: Fetches all registered users.
-   **Method**: `GET`
-   **Endpoint**: `/admin/users`
-   **Authorization**: Bearer Token (User must have `admin` role)
-   **Success Response (`200 OK`, `application/json`)**:
    ```json
    [
      {
        "id": 1,
        "username": "adminuser",
        "email": "admin@zenith.com",
        "fullName": "Admin User",
        "address": "123 Admin St, Admin City",
        "phoneNumber": "555-1111",
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z",
        "role": "admin"
      },
      {
        "id": 2,
        "username": "johndoe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "address": "456 Main St, Anytown",
        "phoneNumber": "555-2222",
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z",
        "role": "customer"
      }
    ]
    ```
-   **Error Responses (`application/json`)**:
    -   `401 Unauthorized`: Invalid or missing token.
    -   `403 Forbidden`: User does not have `admin` privileges.
    -   `500 Internal Server Error`: Server error.

---

## Payment Method Endpoints (TODO - Outline for future implementation)

-   `GET /payment-methods`: Get all payment methods for the authenticated user.
-   `POST /payment-methods`: Add a new payment method.
-   `GET /payment-methods/{id}`: Get a specific payment method by ID.
-   `PUT /payment-methods/{id}`: Update a payment method.
-   `DELETE /payment-methods/{id}`: Delete a payment method.

---

## Transaction Endpoints (TODO - Outline for future implementation)

-   `GET /transactions`: Get all transactions for the authenticated user.
-   `POST /transactions/process`: Initiate a new payment transaction.
-   `GET /transactions/{id}`: Get a specific transaction by ID.
-   `POST /transactions/{id}/refund`: Initiate a refund for a transaction.
-   `GET /transactions/admin`: Get all transactions (Admin Only).

---

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format.

```json
{
  "message": "Descriptive error message here."
}
```
```