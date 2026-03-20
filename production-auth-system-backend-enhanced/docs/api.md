# Authentication System API Documentation

This document describes the RESTful API endpoints for the authentication system.
The API is versioned at `/api/v1` and typically runs on `http://localhost:5000` in development.

## Base URL

`http://localhost:5000/api/v1`

## Authentication

All protected routes require an `Authorization` header with a valid JWT access token:
`Authorization: Bearer <ACCESS_TOKEN>`

Refresh tokens are handled via `HttpOnly` cookies.

---

## Endpoints

### 1. User Registration

*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Description:** Registers a new user with an email and password.
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request Body:**
    ```json
    {
      "email": "string",  // Required, valid email format
      "password": "string" // Required, min 8, max 30 characters
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "data": {
        "accessToken": "string", // JWT Access Token (short-lived)
        "user": {
          "id": "string",
          "email": "string",
          "isEmailVerified": "boolean",
          "role": "string", // "user" or "admin"
          "createdAt": "string",
          "updatedAt": "string"
        }
      }
    }
    ```
    **Note:** A `Set-Cookie` header will be present with the `refreshToken` (HttpOnly).
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., email format, password strength).
    *   `400 Bad Request`: User with this email already exists.
    *   `429 Too Many Requests`: Rate limit exceeded.

### 2. User Login

*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Description:** Authenticates a user and issues new access and refresh tokens.
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request Body:**
    ```json
    {
      "email": "string",  // Required, valid email format
      "password": "string" // Required, min 1 character
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Logged in successfully",
      "data": {
        "accessToken": "string", // JWT Access Token (short-lived)
        "user": {
          "id": "string",
          "email": "string",
          "isEmailVerified": "boolean",
          "role": "string",
          "createdAt": "string",
          "updatedAt": "string"
        }
      }
    }
    ```
    **Note:** A `Set-Cookie` header will be present with the `refreshToken` (HttpOnly).
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Invalid credentials.
    *   `429 Too Many Requests`: Rate limit exceeded.

### 3. Refresh Access Token

*   **URL:** `/auth/refresh-token`
*   **Method:** `POST`
*   **Description:** Uses a valid refresh token to obtain a new access token and a new refresh token (token rotation).
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request:** Expects the `refreshToken` to be sent in an `HttpOnly` cookie.
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Tokens refreshed successfully",
      "data": {
        "accessToken": "string", // New JWT Access Token
        "user": { /* ... user details ... */ }
      }
    }
    ```
    **Note:** A new `Set-Cookie` header will be present with the new `refreshToken`.
*   **Error Responses:**
    *   `401 Unauthorized`: No refresh token provided, invalid, expired, or revoked refresh token.
    *   `429 Too Many Requests`: Rate limit exceeded.

### 4. User Logout

*   **URL:** `/auth/logout`
*   **Method:** `POST`
*   **Description:** Revokes the current refresh token and clears the `refreshToken` cookie from the client.
*   **Request:** Expects the `refreshToken` to be sent in an `HttpOnly` cookie.
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Logged out successfully"
    }
    ```
    **Note:** A `Set-Cookie` header will be present to clear the `refreshToken` cookie.
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid refresh token (even if an error occurs, the cookie is cleared on the client).

### 5. Get User Profile

*   **URL:** `/auth/profile`
*   **Method:** `GET`
*   **Description:** Retrieves the profile details of the authenticated user.
*   **Authentication:** Required (valid JWT Access Token in `Authorization` header).
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "User profile fetched successfully",
      "data": {
        "id": "string",
        "email": "string",
        "role": "string",
        "isEmailVerified": "boolean",
        "createdAt": "string",
        "updatedAt": "string"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: No or invalid access token.

### 6. Admin Dashboard (Example Protected Route)

*   **URL:** `/auth/admin-dashboard`
*   **Method:** `GET`
*   **Description:** An example route that requires `admin` role authorization.
*   **Authentication:** Required (valid JWT Access Token in `Authorization` header).
*   **Authorization:** User must have `admin` role.
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Welcome to the admin dashboard!",
      "user": { /* ... user details ... */ }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: No or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have the `admin` role.

### 7. Forgot Password

*   **URL:** `/auth/forgot-password`
*   **Method:** `POST`
*   **Description:** Initiates the password reset process. Sends a (mock) reset link/token to the user's email.
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request Body:**
    ```json
    {
      "email": "string" // Required, valid email format
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "If an account with that email exists, a password reset link has been sent."
    }
    ```
    **Note:** For security reasons, this endpoint always returns a generic success message, regardless of whether the email exists in the database, to prevent email enumeration.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid email format.
    *   `429 Too Many Requests`: Rate limit exceeded.

### 8. Reset Password

*   **URL:** `/auth/reset-password`
*   **Method:** `POST`
*   **Description:** Resets the user's password using a valid reset token.
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request Body:**
    ```json
    {
      "token": "string",    // Required, the reset token received via email
      "password": "string"  // Required, new password, min 8, max 30 characters
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Password has been reset successfully. Please log in with your new password."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid new password (e.g., strength requirements).
    *   `401 Unauthorized`: Invalid or expired reset token.
    *   `404 Not Found`: User associated with the token not found.
    *   `429 Too Many Requests`: Rate limit exceeded.

---