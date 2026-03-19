# Authentication System API Documentation

This document provides a comprehensive overview of the RESTful API endpoints for the Authentication System. You can also interact with the API directly via the Swagger UI at `http://localhost:8080/swagger-ui.html` when the application is running.

## Base URL

The base URL for all API endpoints is `http://localhost:8080/api`.

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header with the `Bearer` scheme.

**Header Example:**
`Authorization: Bearer <your_jwt_token>`

## 1. Authentication Endpoints (`/api/auth`)

### 1.1. Register a New User

Registers a new user account. Assigns the `ROLE_USER` by default.

*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Authentication:** None (Public)
*   **Request Body:** `application/json`
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "strongpassword123"
    }
    ```
    **Constraints:**
    *   `username`: Not blank, 3-20 characters.
    *   `email`: Not blank, valid email format, max 50 characters.
    *   `password`: Not blank, 6-40 characters.
*   **Success Response:** `201 Created`
    ```
    User registered successfully!
    ```
*   **Error Responses:**
    *   `400 Bad Request` if input validation fails or username/email already exists.
        ```json
        {
          "username": "Username must be between 3 and 20 characters",
          "email": "Email must be a valid email address"
        }
        ```
        or
        ```
        Username is already taken!
        ```
        or
        ```
        Email address already in use!
        ```

### 1.2. User Login

Authenticates a user and returns a JWT for subsequent requests.

*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Authentication:** None (Public)
*   **Request Body:** `application/json`
    ```json
    {
      "username": "existinguser",
      "password": "existingpassword"
    }
    ```
    **Constraints:**
    *   `username`: Not blank.
    *   `password`: Not blank.
*   **Success Response:** `200 OK`
    ```json
    {
      "token": "eyJhbGciOiJIUzUxMi...",
      "username": "existinguser",
      "email": "existing@example.com",
      "roles": ["ROLE_USER"]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request` if input validation fails.
    *   `401 Unauthorized` if invalid username or password.
        ```
        Invalid username or password.
        ```

## 2. User Endpoints (`/api/users`)

These endpoints require an authenticated user (either `ROLE_USER` or `ROLE_ADMIN`).

### 2.1. Get Current User Profile

Retrieves the profile information of the currently authenticated user.

*   **URL:** `/api/users/me`
*   **Method:** `GET`
*   **Authentication:** Required (JWT)
*   **Success Response:** `200 OK`
    ```json
    {
      "id": 1,
      "username": "currentuser",
      "email": "currentuser@example.com",
      "roles": [
        {"id": 1, "name": "ROLE_USER"}
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized` if JWT is missing or invalid.
    *   `403 Forbidden` if authenticated user doesn't have required roles (unlikely for `/me`).
    *   `404 Not Found` if user somehow not found (unlikely after authentication).

### 2.2. Update Current User Profile

Updates the email and/or password of the currently authenticated user. Only fields provided in the request body will be updated.

*   **URL:** `/api/users/me`
*   **Method:** `PUT`
*   **Authentication:** Required (JWT)
*   **Request Body:** `application/json`
    ```json
    {
      "email": "newemail@example.com",
      "password": "mynewstrongpassword"
    }
    ```
    **Constraints:**
    *   `email`: Optional, valid email format, max 50 characters.
    *   `password`: Optional, 6-40 characters.
*   **Success Response:** `200 OK`
    ```json
    {
      "id": 1,
      "username": "currentuser",
      "email": "newemail@example.com",
      "roles": [
        {"id": 1, "name": "ROLE_USER"}
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request` if input validation fails or new email is already in use by another user.
    *   `401 Unauthorized` if JWT is missing or invalid.
    *   `403 Forbidden` if authenticated user doesn't have required roles.

## 3. Admin Endpoints (`/api/admin`)

These endpoints require an authenticated user with the `ROLE_ADMIN`.

### 3.1. Get All Users

Retrieves a list of all registered users in the system.

*   **URL:** `/api/admin/users`
*   **Method:** `GET`
*   **Authentication:** Required (JWT with `ROLE_ADMIN`)
*   **Success Response:** `200 OK`
    ```json
    [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "roles": [
          {"id": 2, "name": "ROLE_ADMIN"}
        ]
      },
      {
        "id": 2,
        "username": "user",
        "email": "user@example.com",
        "roles": [
          {"id": 1, "name": "ROLE_USER"}
        ]
      }
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized` if JWT is missing or invalid.
    *   `403 Forbidden` if authenticated user does not have `ROLE_ADMIN`.

### 3.2. Delete User by ID

Deletes a user account from the system by their ID.

*   **URL:** `/api/admin/users/{userId}`
*   **Method:** `DELETE`
*   **Authentication:** Required (JWT with `ROLE_ADMIN`)
*   **Path Parameters:**
    *   `userId` (long): The ID of the user to delete.
*   **Success Response:** `200 OK`
    ```
    User deleted successfully!
    ```
*   **Error Responses:**
    *   `401 Unauthorized` if JWT is missing or invalid.
    *   `403 Forbidden` if authenticated user does not have `ROLE_ADMIN`.
    *   `404 Not Found` if the user with the given ID does not exist.

---
```