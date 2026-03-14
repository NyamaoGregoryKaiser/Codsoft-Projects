# API Documentation - Authentication System

This document describes the RESTful API endpoints for the Authentication System backend.

**Base URL**: `http://localhost:9080/api` (adjust based on deployment)

---

## 1. Authentication Endpoints

### 1.1. Register User

*   **Endpoint**: `/auth/register`
*   **Method**: `POST`
*   **Description**: Registers a new user account.
*   **Request Body**: `application/json`
    ```json
    {
      "username": "newuser",
      "password": "strongpassword123",
      "role": "USER"  // Optional, defaults to "USER". "ADMIN" can be set but should be restricted in production.
    }
    ```
*   **Success Response**: `201 Created`
    ```json
    {
      "status": "success",
      "message": "User registered successfully",
      "user": {
        "id": 1,
        "username": "newuser",
        "role": "USER"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON, missing fields, weak password, invalid username format.
    *   `409 Conflict`: User with this username already exists.
    *   `500 Internal Server Error`: Server-side issue during registration.
*   **Example `curl`**:
    ```bash
    curl -X POST http://localhost:9080/api/auth/register \
         -H "Content-Type: application/json" \
         -d '{ "username": "jane_doe", "password": "securepassword", "role": "USER" }'
    ```

### 1.2. Login User

*   **Endpoint**: `/auth/login`
*   **Method**: `POST`
*   **Description**: Authenticates a user and issues access and refresh tokens.
*   **Request Body**: `application/json`
    ```json
    {
      "username": "newuser",
      "password": "strongpassword123"
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Login successful",
      "user": {
        "id": 1,
        "username": "newuser",
        "role": "USER"
      },
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON, missing fields.
    *   `401 Unauthorized`: Invalid credentials (username/password mismatch).
    *   `404 Not Found`: User not found.
    *   `500 Internal Server Error`: Server-side issue during login.
*   **Example `curl`**:
    ```bash
    curl -X POST http://localhost:9080/api/auth/login \
         -H "Content-Type: application/json" \
         -d '{ "username": "jane_doe", "password": "securepassword" }'
    ```

### 1.3. Refresh Tokens

*   **Endpoint**: `/auth/refresh`
*   **Method**: `POST`
*   **Description**: Exchanges a valid refresh token for new access and refresh tokens.
*   **Request Body**: `application/json`
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Tokens refreshed successfully",
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON, missing refresh token.
    *   `401 Unauthorized`: Invalid or expired refresh token.
    *   `500 Internal Server Error`: Server-side issue during token refresh.
*   **Example `curl`**:
    ```bash
    curl -X POST http://localhost:9080/api/auth/refresh \
         -H "Content-Type: application/json" \
         -d '{ "refreshToken": "YOUR_REFRESH_TOKEN_HERE" }'
    ```

### 1.4. Logout User

*   **Endpoint**: `/auth/logout`
*   **Method**: `POST`
*   **Description**: (Client-side token invalidation in a stateless JWT system). This endpoint serves as a server-side confirmation.
*   **Headers**: `Authorization: Bearer <accessToken>`
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Logged out successfully."
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `500 Internal Server Error`: Server-side issue during logout.
*   **Example `curl`**:
    ```bash
    curl -X POST http://localhost:9080/api/auth/logout \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
    ```

---

## 2. User Profile Endpoints (Requires Authentication)

### 2.1. Get User Profile

*   **Endpoint**: `/users/profile`
*   **Method**: `GET`
*   **Description**: Retrieves the authenticated user's profile information.
*   **Headers**: `Authorization: Bearer <accessToken>`
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User profile retrieved.",
      "user": {
        "id": 1,
        "username": "newuser",
        "role": "USER"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `404 Not Found`: User profile not found (shouldn't happen for authenticated user).
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X GET http://localhost:9080/api/users/profile \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
    ```

### 2.2. Update User Profile

*   **Endpoint**: `/users/profile`
*   **Method**: `PUT`
*   **Description**: Updates the authenticated user's profile (username, password).
*   **Headers**: `Authorization: Bearer <accessToken>`
*   **Request Body**: `application/json` (partial update allowed)
    ```json
    {
      "username": "updated_username",  // Optional
      "password": "newstrongpassword"  // Optional
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User profile updated successfully.",
      "user": {
        "id": 1,
        "username": "updated_username",
        "role": "USER"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON, weak password, username already taken by another user, invalid username format.
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `409 Conflict`: Username already taken.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X PUT http://localhost:9080/api/users/profile \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
         -H "Content-Type: application/json" \
         -d '{ "username": "john_doe_updated", "password": "new_secure_password" }'
    ```

---

## 3. Admin Endpoints (Requires Admin Role)

These endpoints require an access token from a user with the `ADMIN` role.

### 3.1. Get All Users

*   **Endpoint**: `/admin/users`
*   **Method**: `GET`
*   **Description**: Retrieves a list of all registered users.
*   **Headers**: `Authorization: Bearer <adminAccessToken>`
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "Users retrieved successfully.",
      "users": [
        { "id": 1, "username": "admin", "role": "ADMIN" },
        { "id": 2, "username": "jane_doe", "role": "USER" }
      ]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X GET http://localhost:9080/api/admin/users \
         -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE"
    ```

### 3.2. Get User by ID

*   **Endpoint**: `/admin/users/:id`
*   **Method**: `GET`
*   **Description**: Retrieves a specific user's profile by their ID.
*   **Headers**: `Authorization: Bearer <adminAccessToken>`
*   **Path Parameters**:
    *   `id` (integer): The ID of the user to retrieve.
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User retrieved successfully.",
      "user": {
        "id": 2,
        "username": "jane_doe",
        "role": "USER"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid ID format.
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: User with the given ID not found.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X GET http://localhost:9080/api/admin/users/2 \
         -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE"
    ```

### 3.3. Create User (Admin)

*   **Endpoint**: `/admin/users`
*   **Method**: `POST`
*   **Description**: Creates a new user account, allowing admin to specify the role.
*   **Headers**: `Authorization: Bearer <adminAccessToken>`
*   **Request Body**: `application/json`
    ```json
    {
      "username": "new_admin_user",
      "password": "adminpassword",
      "role": "ADMIN" // Admin can explicitly set roles
    }
    ```
*   **Success Response**: `201 Created`
    ```json
    {
      "status": "success",
      "message": "User created successfully by admin.",
      "user": {
        "id": 3,
        "username": "new_admin_user",
        "role": "ADMIN"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON, missing fields, weak password, invalid username/role.
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `409 Conflict`: User with this username already exists.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X POST http://localhost:9080/api/admin/users \
         -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE" \
         -H "Content-Type: application/json" \
         -d '{ "username": "john_admin", "password": "secureadminpass", "role": "ADMIN" }'
    ```

### 3.4. Update User (Admin)

*   **Endpoint**: `/admin/users/:id`
*   **Method**: `PUT`
*   **Description**: Updates a specific user's profile (username, password, role) by their ID.
*   **Headers**: `Authorization: Bearer <adminAccessToken>`
*   **Path Parameters**:
    *   `id` (integer): The ID of the user to update.
*   **Request Body**: `application/json` (partial update allowed)
    ```json
    {
      "username": "updated_user_by_admin", // Optional
      "password": "new_user_password",    // Optional
      "role": "USER"                     // Optional (can change roles)
    }
    ```
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User updated successfully by admin.",
      "user": {
        "id": 2,
        "username": "updated_user_by_admin",
        "role": "USER"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid ID format, invalid JSON, weak password, username already taken, invalid role.
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: User with the given ID not found.
    *   `409 Conflict`: Username already taken by another user.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X PUT http://localhost:9080/api/admin/users/2 \
         -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE" \
         -H "Content-Type: application/json" \
         -d '{ "username": "jane_updated_by_admin", "role": "ADMIN" }'
    ```

### 3.5. Delete User (Admin)

*   **Endpoint**: `/admin/users/:id`
*   **Method**: `DELETE`
*   **Description**: Deletes a user account by their ID.
*   **Headers**: `Authorization: Bearer <adminAccessToken>`
*   **Path Parameters**:
    *   `id` (integer): The ID of the user to delete.
*   **Success Response**: `200 OK`
    ```json
    {
      "status": "success",
      "message": "User deleted successfully by admin."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid ID format.
    *   `401 Unauthorized`: Missing or invalid access token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: User with the given ID not found.
    *   `500 Internal Server Error`: Server-side issue.
*   **Example `curl`**:
    ```bash
    curl -X DELETE http://localhost:9080/api/admin/users/3 \
         -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN_HERE"
    ```

---

## 4. Generic Error Response Structure

All error responses from the API will follow this JSON structure:

```json
{
  "status": "error",
  "message": "A descriptive error message."
}
```