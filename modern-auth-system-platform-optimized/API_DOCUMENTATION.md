```markdown
# API Documentation

This document provides a summary of the RESTful API endpoints exposed by the backend application. For an interactive and up-to-date API documentation, please refer to the **Swagger UI** running with the backend.

**Base URL**: `http://localhost:8080/api`

## Accessing Swagger UI

Once the backend is running, you can access the interactive documentation at:
**`http://localhost:8080/swagger-ui/index.html`**

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token (e.g., `Authorization: Bearer <your_access_token>`).

You can obtain an `accessToken` and `refreshToken` by using the `/api/auth/login` endpoint. In Swagger UI, you can use the "Authorize" button to set your JWT token.

---

## 1. Authentication Endpoints (`/api/auth`)

These endpoints handle user registration, login, and token management.

### `POST /api/auth/register`

Registers a new user in the system. Default role is `USER`.

*   **Request Body**: `application/json`
    ```json
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "password": "strongPassword123"
    }
    ```
*   **Response**: `200 OK`
    ```json
    {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "tokenType": "Bearer"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid input (e.g., email format, password length) or user with email already exists.

### `POST /api/auth/login`

Authenticates a user and returns JWT access and refresh tokens.

*   **Request Body**: `application/json`
    ```json
    {
      "email": "user@example.com",
      "password": "user123"
    }
    ```
*   **Response**: `200 OK`
    ```json
    {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "tokenType": "Bearer"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid email or password.
    *   `400 Bad Request`: Invalid input (e.g., empty email/password).
    *   `429 Too Many Requests`: Rate limit exceeded.

### `POST /api/auth/refresh-token`

Refreshes an expired access token using a valid refresh token.

*   **Authentication**: None (the refresh token itself is the credential).
*   **Request Body**: `application/json`
    ```json
    {
      "refreshToken": "eyJhbGci..."
    }
    ```
*   **Response**: `200 OK`
    ```json
    {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "tokenType": "Bearer"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid or expired refresh token.
    *   `400 Bad Request`: Refresh token missing.

### `POST /api/auth/logout`

(Conceptual for stateless JWT) In a stateless JWT system, logout is primarily a client-side action (deleting tokens). This endpoint acknowledges the request.

*   **Authentication**: `Bearer Token` (optional, for session invalidation if implemented).
*   **Response**: `200 OK`
    ```
    "Logged out successfully."
    ```

---

## 2. User Management Endpoints (`/api/users`)

These endpoints allow management of user profiles. Access is restricted by roles.

*   **Authentication**: `Bearer Token` (required for all endpoints in this section).

### `GET /api/users`

Retrieves a list of all users.

*   **Authorization**: `ADMIN` role required.
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": "uuid-1",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com",
        "roles": ["ADMIN", "USER"]
      },
      {
        "id": "uuid-2",
        "firstName": "Regular",
        "lastName": "User",
        "email": "user@example.com",
        "roles": ["USER"]
      }
    ]
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.

### `GET /api/users/{id}`

Retrieves a user by their ID.

*   **Authorization**: `ADMIN` role OR the authenticated user's ID matches `{id}`.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the user.
*   **Response**: `200 OK`
    ```json
    {
      "id": "uuid-1",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "roles": ["ADMIN", "USER"]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user is neither `ADMIN` nor the requested user.
    *   `404 Not Found`: User with the specified ID does not exist.

### `PUT /api/users/{id}`

Updates an existing user's details.

*   **Authorization**: `ADMIN` role OR the authenticated user's ID matches `{id}`.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the user to update.
*   **Request Body**: `application/json`
    ```json
    {
      "firstName": "Updated",
      "lastName": "Name",
      "email": "updated.email@example.com",
      "roles": ["USER"] # Roles might not be updated via this endpoint in a real scenario
    }
    ```
*   **Response**: `200 OK` (Returns the updated User object)
    ```json
    {
      "id": "uuid-1",
      "firstName": "Updated",
      "lastName": "Name",
      "email": "updated.email@example.com",
      "roles": ["ADMIN", "USER"] # Actual roles from backend, might not match request
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user is neither `ADMIN` nor the requested user.
    *   `404 Not Found`: User with the specified ID does not exist.
    *   `400 Bad Request`: Invalid input (e.g., email format).

### `DELETE /api/users/{id}`

Deletes a user by their ID.

*   **Authorization**: `ADMIN` role required.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the user to delete.
*   **Response**: `204 No Content`
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: User with the specified ID does not exist.

---

## 3. Product Management Endpoints (`/api/products`)

These endpoints allow management of products. Access is restricted by roles.

*   **Authentication**: `Bearer Token` (required for all endpoints in this section).

### `GET /api/products`

Retrieves a list of all products.

*   **Authorization**: `USER` or `ADMIN` role required.
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": "uuid-product-1",
        "name": "Laptop Pro",
        "description": "High-performance laptop for professionals",
        "price": 1200.00,
        "stockQuantity": 50
      },
      {
        "id": "uuid-product-2",
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with long battery life",
        "price": 25.50,
        "stockQuantity": 200
      }
    ]
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.

### `GET /api/products/{id}`

Retrieves a single product by its ID.

*   **Authorization**: `USER` or `ADMIN` role required.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the product.
*   **Response**: `200 OK`
    ```json
    {
      "id": "uuid-product-1",
      "name": "Laptop Pro",
      "description": "High-performance laptop for professionals",
      "price": 1200.00,
      "stockQuantity": 50
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `404 Not Found`: Product with the specified ID does not exist.

### `POST /api/products`

Creates a new product.

*   **Authorization**: `ADMIN` role required.
*   **Request Body**: `application/json`
    ```json
    {
      "name": "New Gaming Headset",
      "description": "Immersive sound with noise cancellation",
      "price": 99.99,
      "stockQuantity": 150
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "id": "uuid-new-product",
      "name": "New Gaming Headset",
      "description": "Immersive sound with noise cancellation",
      "price": 99.99,
      "stockQuantity": 150
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `400 Bad Request`: Invalid input (e.g., empty name, negative price).

### `PUT /api/products/{id}`

Updates an existing product.

*   **Authorization**: `ADMIN` role required.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the product to update.
*   **Request Body**: `application/json`
    ```json
    {
      "name": "Updated Laptop Pro",
      "description": "High-performance laptop, now with better battery",
      "price": 1250.00,
      "stockQuantity": 45
    }
    ```
*   **Response**: `200 OK` (Returns the updated Product object)
    ```json
    {
      "id": "uuid-product-1",
      "name": "Updated Laptop Pro",
      "description": "High-performance laptop, now with better battery",
      "price": 1250.00,
      "stockQuantity": 45
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: Product with the specified ID does not exist.
    *   `400 Bad Request`: Invalid input.

### `DELETE /api/products/{id}`

Deletes a product by its ID.

*   **Authorization**: `ADMIN` role required.
*   **Path Parameters**:
    *   `id` (UUID): The ID of the product to delete.
*   **Response**: `204 No Content`
*   **Error Responses**:
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Authenticated user does not have `ADMIN` role.
    *   `404 Not Found`: Product with the specified ID does not exist.
```