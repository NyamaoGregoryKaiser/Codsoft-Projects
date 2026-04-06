# API Documentation - Secure C++ Web Application

This document details the RESTful API endpoints for the Secure C++ Web Application.

**Base URL:** `https://localhost/api` (when running locally via Nginx)

## Authentication

All `Content-Type` for POST/PUT requests is `application/json`. All responses are `application/json`.

### 1. Register User

*   **Endpoint:** `POST /auth/register`
*   **Description:** Registers a new user with an email, password, and role.
*   **Request Body:**
    ```json
    {
        "email": "newuser@example.com",
        "password": "StrongPassword123!",
        "role": "USER" // Allowed roles: "USER", "ADMIN" (for seeding)
    }
    ```
*   **Successful Response (201 Created):**
    ```json
    {
        "accessToken": "eyJ...",
        "refreshToken": "eyJ..."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., missing fields, invalid role).
    *   `409 Conflict`: User with this email already exists (`code: 4090`).
    *   `429 Too Many Requests`: Rate limit exceeded (`code: 4290`).

### 2. Login User

*   **Endpoint:** `POST /auth/login`
*   **Description:** Authenticates a user and returns access and refresh tokens.
*   **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "securepassword123"
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
        "accessToken": "eyJ...",
        "refreshToken": "eyJ..."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., missing fields).
    *   `401 Unauthorized`: Invalid email or password (`code: 4011`).
    *   `429 Too Many Requests`: Rate limit exceeded (`code: 4290`).

### 3. Refresh Tokens

*   **Endpoint:** `POST /auth/refresh`
*   **Description:** Uses a refresh token to obtain a new access token and refresh token pair.
*   **Request Body:**
    ```json
    {
        "refreshToken": "eyJ..."
    }
    ```
*   **Successful Response (200 OK):**
    ```json
    {
        "accessToken": "eyJ...",
        "refreshToken": "eyJ..."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `refreshToken`.
    *   `401 Unauthorized`: Invalid or expired refresh token, or wrong token type (`code: 4010`).

---

## User Management

These endpoints require authentication. The `Authorization` header must be set to `Bearer <ACCESS_TOKEN>`.

### 1. Get Current User Profile

*   **Endpoint:** `GET /users/me`
*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Authentication:** Requires valid `accessToken` (`USER` or `ADMIN` role).
*   **Successful Response (200 OK):**
    ```json
    {
        "id": "a2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        "email": "user@example.com",
        "password_hash": "[REDACTED]",
        "role": "USER",
        "created_at": "2023-10-27T10:00:00Z",
        "updated_at": "2023-10-27T10:00:00Z"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing `accessToken` (`code: 4010`).
    *   `404 Not Found`: User associated with token not found (`code: 4040`).

### 2. Get User by ID (Admin Only)

*   **Endpoint:** `GET /users/{id}`
*   **Description:** Retrieves the profile of a specific user by their ID.
*   **Authentication:** Requires valid `accessToken` with `ADMIN` role.
*   **Path Parameters:**
    *   `id` (string): The UUID of the user.
*   **Successful Response (200 OK):** (Same as `GET /users/me`, but for any user)
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing `accessToken` (`code: 4010`).
    *   `403 Forbidden`: User does not have `ADMIN` role (`code: 4030`).
    *   `404 Not Found`: User with the given ID not found (`code: 4040`).

### 3. Update User by ID (Admin Only)

*   **Endpoint:** `PUT /users/{id}`
*   **Description:** Updates the profile of a specific user by their ID.
*   **Authentication:** Requires valid `accessToken` with `ADMIN` role.
*   **Path Parameters:**
    *   `id` (string): The UUID of the user to update.
*   **Request Body:**
    ```json
    {
        "email": "updated_user@example.com",
        "password": "NewStrongPassword!", // Optional: include to change password
        "role": "ADMIN" // Update user's role
    }
    ```
*   **Successful Response (200 OK):** (Returns the updated user object, `password_hash` redacted)
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., missing fields, invalid role).
    *   `401 Unauthorized`: Invalid or missing `accessToken` (`code: 4010`).
    *   `403 Forbidden`: User does not have `ADMIN` role (`code: 4030`).
    *   `404 Not Found`: User with the given ID not found (`code: 4040`).
    *   `409 Conflict`: New email already taken by another user (`code: 4090`).

### 4. Delete User by ID (Admin Only)

*   **Endpoint:** `DELETE /users/{id}`
*   **Description:** Deletes a specific user by their ID.
*   **Authentication:** Requires valid `accessToken` with `ADMIN` role.
*   **Path Parameters:**
    *   `id` (string): The UUID of the user to delete.
*   **Successful Response (204 No Content):**
    *   Response body is empty.
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing `accessToken` (`code: 4010`).
    *   `403 Forbidden`: User does not have `ADMIN` role (`code: 4030`).
    *   `404 Not Found`: User with the given ID not found (`code: 4040`).

---

## Error Codes

The API returns consistent JSON error objects for exceptions.
```json
{
    "message": "Error description",
    "code": 4010 // Specific numeric error code
}
```

*   **`4000` (INVALID_INPUT):** Generic bad request due to malformed or missing data.
*   **`4010` (UNAUTHORIZED):** Authentication failed (e.g., missing/invalid token, token type mismatch).
*   **`4011` (BAD_CREDENTIALS):** Specific unauthorized error for invalid email/password during login.
*   **`4030` (FORBIDDEN):** Authorization failed (e.g., insufficient permissions/role).
*   **`4040` (NOT_FOUND):** The requested resource does not exist.
*   **`4090` (CONFLICT):** Resource already exists or operation conflicts with current state.
*   **`4290` (TOO_MANY_REQUESTS):** Rate limit for the client has been exceeded.
*   **`5000` (INTERNAL_SERVER_ERROR):** Generic unhandled server error.
*   **`5030` (SERVICE_UNAVAILABLE):** Service is temporarily unavailable (e.g., database connection issues).
*   **`0` (UNKNOWN_ERROR):** Catastrophic or unexpected error.