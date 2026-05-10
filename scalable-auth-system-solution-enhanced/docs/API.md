```markdown
# API Documentation: AuthSystem

This document provides a comprehensive overview of the RESTful API endpoints for the AuthSystem backend.
All responses are in JSON format. Error responses follow a consistent structure.

**Base URL**: `http://localhost:8080` (or your configured application host/port)

---

## Error Response Structure

All API errors return a JSON object with the following structure:

```json
{
  "status": "error",
  "message": "A human-readable error description.",
  "code": "ERROR_CODE_ENUM_OR_STRING", // Optional, specific error code
  "details": { /* Optional, additional error details (e.g., validation errors) */ }
}
```

**Common HTTP Status Codes:**

*   `200 OK`: Request successful.
*   `201 Created`: Resource successfully created.
*   `204 No Content`: Request successful, but no content to return (e.g., successful deletion).
*   `400 Bad Request`: Invalid request payload or parameters.
*   `401 Unauthorized`: Authentication required or invalid/expired token.
*   `403 Forbidden`: Authenticated, but user does not have necessary permissions.
*   `404 Not Found`: Resource not found.
*   `409 Conflict`: Resource already exists (e.g., user registration with existing email).
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Server-side error.

---

## 1. Authentication Endpoints

### 1.1. User Registration

Registers a new user account.

*   **URL**: `/register`
*   **Method**: `POST`
*   **Request Body**: `application/json`
    ```json
    {
      "username": "string",  // Min 3, Max 50 characters
      "email": "string",     // Valid email format, unique
      "password": "string"   // Min 8 characters, strong password policy recommended
    }
    ```
*   **Success Response**: `201 Created`
    ```json
    {
      "status": "success",
      "message": "User registered successfully."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid input (e.g., missing fields, weak password, invalid email format).
    *   `409 Conflict`: Email already registered.

### 1.2. User Login

Authenticates a user and issues JWT access and refresh tokens.

*   **URL**: `/login`
*   **Method**: `POST`
*   **Request Body**: `application/json`
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Login successful.",
      "data": {
        "user_id": "uuid",
        "username": "string",
        "email": "string",
        "access_token": "string", // JWT access token
        "refresh_token": "string", // JWT refresh token
        "expires_in": 3600 // Access token expiration in seconds
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing email or password.
    *   `401 Unauthorized`: Invalid email or password.

### 1.3. Refresh Access Token

Obtains a new access token using a valid refresh token.

*   **URL**: `/refresh-token`
*   **Method**: `POST`
*   **Request Body**: `application/json`
    ```json
    {
      "refresh_token": "string" // The refresh token obtained from /login
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Access token refreshed successfully.",
      "data": {
        "access_token": "string", // New JWT access token
        "expires_in": 3600 // New access token expiration in seconds
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing refresh token.
    *   `401 Unauthorized`: Invalid or expired refresh token.

---

## 2. User Profile Endpoints (Protected)

These endpoints require authentication. Include an `Authorization` header with a valid JWT access token:
`Authorization: Bearer <your_access_token>`

### 2.1. Get User Profile

Retrieves the profile of the authenticated user.

*   **URL**: `/me`
*   **Method**: `GET`
*   **Request Headers**:
    *   `Authorization: Bearer <access_token>`
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User profile retrieved successfully.",
      "data": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Missing, invalid, or expired access token.
    *   `404 Not Found`: User not found (shouldn't happen for authenticated user).

### 2.2. Update User Profile

Updates the profile information of the authenticated user.

*   **URL**: `/me`
*   **Method**: `PUT`
*   **Request Headers**:
    *   `Authorization: Bearer <access_token>`
*   **Request Body**: `application/json`
    ```json
    {
      "username": "string",  // Optional
      "email": "string",     // Optional, if provided, must be unique and valid
      "password": "string"   // Optional, if provided, updates password (requires old password verification conceptually,
                             // but for this example, it directly updates).
                             // In a real system, a separate endpoint for password change is better.
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User profile updated successfully.",
      "data": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid input (e.g., invalid email format, weak password).
    *   `401 Unauthorized`: Missing, invalid, or expired access token.
    *   `409 Conflict`: New email already registered by another user.

### 2.3. Delete User Profile (Soft Delete)

Marks the authenticated user's account as deleted. The record is not permanently removed from the database.

*   **URL**: `/me`
*   **Method**: `DELETE`
*   **Request Headers**:
    *   `Authorization: Bearer <access_token>`
*   **Success Response**: `204 No Content`
    (No content returned, indicates successful deletion)
*   **Error Responses**:
    *   `401 Unauthorized`: Missing, invalid, or expired access token.
    *   `404 Not Found`: User not found (shouldn't happen for authenticated user).

---

## 3. Health Check Endpoint

### 3.1. Health Check

Checks the status of the application.

*   **URL**: `/health`
*   **Method**: `GET`
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "healthy",
      "timestamp": "2023-10-27T10:30:00Z"
    }
    ```
*   **Error Responses**:
    *   `500 Internal Server Error`: If any critical component (e.g., database) is unhealthy.

---
```