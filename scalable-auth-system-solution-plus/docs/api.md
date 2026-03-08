# API Documentation

This document provides a summary of the RESTful API endpoints for the Authentication and Task Management System. For interactive exploration and testing, please refer to the **Swagger UI** at `http://localhost:8080/swagger-ui.html` when the backend is running.

All endpoints are prefixed with `/api/v1`.

## Authentication Endpoints (`/api/v1/auth`)

These endpoints handle user registration, login, token management, and password reset.

### 1. Register a new user
*   **POST** `/api/v1/auth/register`
*   **Description:** Creates a new user account.
*   **Request Body:** `application/json`
    ```json
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongPassword123"
    }
    ```
*   **Response (201 Created):** `application/json`
    ```json
    {
        "accessToken": "eyJhbGciOiJIUzI1Ni...",
        "refreshToken": "uuid-string-for-refresh-token",
        "userId": 2,
        "username": "newuser",
        "email": "newuser@example.com",
        "roles": ["USER"]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., missing fields, weak password).
    *   `409 Conflict`: Email or username already registered.

### 2. Authenticate user and get JWT tokens
*   **POST** `/api/v1/auth/login`
*   **Description:** Authenticates a user with credentials and returns JWT access and refresh tokens.
*   **Request Body:** `application/json`
    ```json
    {
        "email": "user@example.com",
        "password": "userpass"
    }
    ```
*   **Response (200 OK):** `application/json`
    ```json
    {
        "accessToken": "eyJhbGciOiJIUzI1Ni...",
        "refreshToken": "uuid-string-for-refresh-token",
        "userId": 1,
        "username": "regularuser",
        "email": "user@example.com",
        "roles": ["USER"]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Invalid email or password.

### 3. Refresh access token using refresh token
*   **POST** `/api/v1/auth/refresh-token`
*   **Description:** Exchanges a valid refresh token for a new access token and a new refresh token (token rotation).
*   **Request Body:** `application/json`
    ```json
    {
        "refreshToken": "uuid-string-for-refresh-token"
    }
    ```
*   **Response (200 OK):** `application/json`
    ```json
    {
        "accessToken": "eyJhbGciOiJIUzI1Ni...",
        "refreshToken": "new-uuid-string-for-refresh-token",
        "userId": 1,
        "username": "regularuser",
        "email": "user@example.com",
        "roles": ["USER"]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `403 Forbidden`: Invalid or expired refresh token.

### 4. Request password reset via email
*   **POST** `/api/v1/auth/forgot-password`
*   **Description:** Initiates a password reset process by sending a reset token to the user's email.
*   **Request Body:** `application/json`
    ```json
    {
        "email": "user@example.com"
    }
    ```
*   **Response (200 OK):** `text/plain`
    ```
    If an account with that email exists, a password reset link has been sent.
    ```
    (Note: A generic success message is returned to prevent email enumeration attacks.)
*   **Error Responses:**
    *   `400 Bad Request`: Invalid email format.

### 5. Confirm password reset with token and new password
*   **POST** `/api/v1/auth/reset-password`
*   **Description:** Resets the user's password using a valid reset token.
*   **Request Body:** `application/json`
    ```json
    {
        "token": "the-reset-token-received-via-email",
        "newPassword": "myNewStrongPassword123"
    }
    ```
*   **Response (200 OK):** `text/plain`
    ```
    Password has been reset successfully.
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid new password or expired token.
    *   `404 Not Found`: Invalid reset token.

## User Management Endpoints (`/api/v1/users`)

These endpoints allow retrieving and updating user profile information. Requires an `Authorization: Bearer <accessToken>` header.

### 1. Get current authenticated user's profile
*   **GET** `/api/v1/users/me`
*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Authorization:** `USER`, `ADMIN`
*   **Response (200 OK):** `application/json`
    ```json
    {
        "id": 1,
        "username": "regularuser",
        "email": "user@example.com",
        "enabled": true,
        "roles": ["USER"],
        "createdAt": "2023-01-01T10:00:00",
        "updatedAt": "2023-01-01T10:00:00"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: Insufficient privileges.

### 2. Update current authenticated user's profile
*   **PUT** `/api/v1/users/me`
*   **Description:** Updates the profile of the currently authenticated user.
*   **Authorization:** `USER`, `ADMIN`
*   **Request Body:** `application/json`
    ```json
    {
        "username": "updatedusername",
        "email": "updated@example.com"
        // Password cannot be changed via this endpoint for security reasons
    }
    ```
*   **Response (200 OK):** `application/json` (updated user profile)
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input or email/username already taken.
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: Insufficient privileges.

### 3. Get user profile by ID (Admin only)
*   **GET** `/api/v1/users/{id}`
*   **Description:** Retrieves a user's profile by their ID.
*   **Authorization:** `ADMIN`
*   **Response (200 OK):** `application/json` (user profile)
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not an ADMIN.
    *   `404 Not Found`: User not found.

### 4. Get all user profiles (Admin only)
*   **GET** `/api/v1/users`
*   **Description:** Retrieves a list of all registered user profiles.
*   **Authorization:** `ADMIN`
*   **Response (200 OK):** `application/json` (list of user profiles)
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not an ADMIN.

## Task Management Endpoints (`/api/v1/tasks`)

These endpoints handle CRUD operations for user tasks. Requires an `Authorization: Bearer <accessToken>` header.

### 1. Create a new task
*   **POST** `/api/v1/tasks`
*   **Description:** Creates a new task for the authenticated user.
*   **Authorization:** `USER`, `ADMIN`
*   **Request Body:** `application/json`
    ```json
    {
        "title": "My New Task",
        "description": "Details about my new task.",
        "completed": false
    }
    ```
*   **Response (201 Created):** `application/json`
    ```json
    {
        "id": 10,
        "title": "My New Task",
        "description": "Details about my new task.",
        "completed": false,
        "userId": 1,
        "createdAt": "2023-05-10T12:00:00",
        "updatedAt": "2023-05-10T12:00:00"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: No valid access token.

### 2. Get a task by ID
*   **GET** `/api/v1/tasks/{id}`
*   **Description:** Retrieves a specific task by its ID. Users can only access their own tasks unless they are an ADMIN.
*   **Authorization:** `USER`, `ADMIN`
*   **Response (200 OK):** `application/json` (TaskDto)
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not the owner of the task and not an ADMIN.
    *   `404 Not Found`: Task not found.

### 3. Get all tasks for the current user
*   **GET** `/api/v1/tasks/my-tasks`
*   **Description:** Retrieves a list of all tasks belonging to the currently authenticated user.
*   **Authorization:** `USER`, `ADMIN`
*   **Response (200 OK):** `application/json` (list of TaskDto)
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.

### 4. Get all tasks (Admin only)
*   **GET** `/api/v1/tasks`
*   **Description:** Retrieves a list of all tasks in the system.
*   **Authorization:** `ADMIN`
*   **Response (200 OK):** `application/json` (list of TaskDto)
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not an ADMIN.

### 5. Update an existing task
*   **PUT** `/api/v1/tasks/{id}`
*   **Description:** Updates an existing task. Users can only update their own tasks unless they are an ADMIN.
*   **Authorization:** `USER`, `ADMIN`
*   **Request Body:** `application/json`
    ```json
    {
        "title": "Updated Task Title",
        "description": "Updated description.",
        "completed": true
    }
    ```
*   **Response (200 OK):** `application/json` (updated TaskDto)
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not the owner of the task and not an ADMIN.
    *   `404 Not Found`: Task not found.

### 6. Delete a task
*   **DELETE** `/api/v1/tasks/{id}`
*   **Description:** Deletes a task by its ID. Users can only delete their own tasks unless they are an ADMIN.
*   **Authorization:** `USER`, `ADMIN`
*   **Response (204 No Content):** Empty response body on successful deletion.
*   **Error Responses:**
    *   `401 Unauthorized`: No valid access token.
    *   `403 Forbidden`: User is not the owner of the task and not an ADMIN.
    *   `404 Not Found`: Task not found.