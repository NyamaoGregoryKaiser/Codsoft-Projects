```markdown
# API Documentation: Enterprise Product Catalog System

This document details the RESTful API endpoints for the Product Catalog System. All endpoints (except login) require authentication via a JSON Web Token (JWT).

**Base URL:** `http://localhost:8080/api/v1`

---

## 1. Authentication

### `POST /auth/login`

Authenticates a user and returns a JWT token. This token must be included in the `Authorization` header for all subsequent protected API calls.

*   **Request:**
    *   **Method:** `POST`
    *   **Path:** `/api/v1/auth/login`
    *   **Headers:** `Content-Type: application/json`
    *   **Body:**
        ```json
        {
            "username": "admin",
            "password": "adminpass"
        }
        ```
        *   `username` (string, required): The user's username.
        *   `password` (string, required): The user's password.

*   **Response (200 OK):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhY2I5NjM3MS1hYzBlLTQ5YTctOGQxNi01M2YyYzg1NWM4YzkiLCJ1c2VybmFtZSI6ImFkbWluIiwiaXNBZG1pbiI6InRydWUiLCJqdGkiOiIyZmMwNGZiMC0zY2U2LTRjZDItYTk5ZS02YTA4NmU3MThhN2UiLCJpYXQiOjE2NzEwMTY2NzgsImV4cCI6MTY3MTAyMDI3OH0.S4o9L2aE5f1z5oX0K9jO0K",
        "message": "Authentication successful."
    }
    ```
    *   `token` (string): The JWT token to be used in subsequent requests.

*   **Error Response (400 Bad Request):** Missing fields.
    ```json
    {
        "error": "Bad Request",
        "message": "Missing required fields: username, password."
    }
    ```

*   **Error Response (401 Unauthorized):** Invalid credentials.
    ```json
    {
        "error": "Unauthorized",
        "message": "Invalid username or password."
    }
    ```

---

## 2. Product Management

All product endpoints require a JWT token in the `Authorization: Bearer <token>` header.

**Example `Authorization` Header:**
`Authorization: Bearer eyJhbGciOiJIUzI1Ni...`

### `POST /products`

Creates a new product.

*   **Authorization:** Required (Admin role only).
*   **Request:**
    *   **Method:** `POST`
    *   **Path:** `/api/v1/products`
    *   **Headers:**
        *   `Content-Type: application/json`
        *   `Authorization: Bearer <your_jwt_token>`
    *   **Body:**
        ```json
        {
            "name": "Laptop Pro X",
            "description": "High performance laptop for professionals.",
            "price": 1200.00,
            "stock": 50,
            "category": "Electronics"
        }
        ```
        *   `name` (string, required): Unique name of the product.
        *   `description` (string, optional): Detailed description.
        *   `price` (number, required): Price of the product (must be >= 0).
        *   `stock` (integer, required): Number of items in stock (must be >= 0).
        *   `category` (string, optional): Product category.

*   **Response (201 Created):**
    ```json
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Laptop Pro X",
        "description": "High performance laptop for professionals.",
        "price": 1200.00,
        "stock": 50,
        "category": "Electronics",
        "createdAt": "2023-10-27T10:30:00Z",
        "updatedAt": "2023-10-27T10:30:00Z"
    }
    ```

*   **Error Response (400 Bad Request):** Missing required fields or invalid data.
    ```json
    {
        "error": "Bad Request",
        "message": "Missing required fields: name, price, stock."
    }
    ```
    Or (if name already exists):
    ```json
    {
        "error": "Bad Request",
        "message": "Product with this name already exists."
    }
    ```

*   **Error Response (401 Unauthorized):** Missing or invalid token.
    ```json
    {
        "error": "Unauthorized",
        "message": "Invalid or expired authentication token."
    }
    ```

*   **Error Response (403 Forbidden):** User is not an administrator.
    ```json
    {
        "error": "Forbidden",
        "message": "Only administrators can create products."
    }
    ```

### `GET /products/{id}`

Retrieves a product by its ID.

*   **Authorization:** Required (Any authenticated user).
*   **Request:**
    *   **Method:** `GET`
    *   **Path:** `/api/v1/products/{id}`
    *   **Headers:** `Authorization: Bearer <your_jwt_token>`

*   **Response (200 OK):**
    ```json
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Laptop Pro X",
        "description": "High performance laptop for professionals.",
        "price": 1200.00,
        "stock": 50,
        "category": "Electronics",
        "createdAt": "2023-10-27T10:30:00Z",
        "updatedAt": "2023-10-27T10:30:00Z"
    }
    ```

*   **Error Response (404 Not Found):** Product with the given ID does not exist.
    ```json
    {
        "error": "Not Found",
        "message": "Product not found with ID: a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```

*   **Error Response (401 Unauthorized):** Missing or invalid token.

### `GET /products`

Retrieves a list of all products.

*   **Authorization:** Required (Any authenticated user).
*   **Request:**
    *   **Method:** `GET`
    *   **Path:** `/api/v1/products`
    *   **Headers:** `Authorization: Bearer <your_jwt_token>`

*   **Response (200 OK):**
    ```json
    [
        {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "name": "Laptop Pro X",
            "description": "High performance laptop for professionals.",
            "price": 1200.00,
            "stock": 50,
            "category": "Electronics",
            "createdAt": "2023-10-27T10:30:00Z",
            "updatedAt": "2023-10-27T10:30:00Z"
        },
        {
            "id": "b2c3d4e5-f6a7-8901-2345-67890abcdeff",
            "name": "Wireless Keyboard",
            "description": "Ergonomic wireless keyboard.",
            "price": 75.50,
            "stock": 200,
            "category": "Peripherals",
            "createdAt": "2023-10-27T10:35:00Z",
            "updatedAt": "2023-10-27T10:35:00Z"
        }
    ]
    ```

*   **Error Response (401 Unauthorized):** Missing or invalid token.

### `PATCH /products/{id}`

Updates an existing product by its ID. Only provided fields will be updated.

*   **Authorization:** Required (Admin role only).
*   **Request:**
    *   **Method:** `PATCH`
    *   **Path:** `/api/v1/products/{id}`
    *   **Headers:**
        *   `Content-Type: application/json`
        *   `Authorization: Bearer <your_jwt_token>`
    *   **Body (Partial Update):**
        ```json
        {
            "price": 1250.00,
            "stock": 45
        }
        ```
        *   `name` (string, optional): New name of the product.
        *   `description` (string, optional): New description.
        *   `price` (number, optional): New price.
        *   `stock` (integer, optional): New stock quantity.
        *   `category` (string, optional): New category.

*   **Response (200 OK):** Returns the updated product object.
    ```json
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Laptop Pro X",
        "description": "High performance laptop for professionals.",
        "price": 1250.00,
        "stock": 45,
        "category": "Electronics",
        "createdAt": "2023-10-27T10:30:00Z",
        "updatedAt": "2023-10-27T10:45:00Z"
    }
    ```

*   **Error Response (400 Bad Request):** Invalid data provided (e.g., negative price).
    ```json
    {
        "error": "Bad Request",
        "message": "New product price must be non-negative."
    }
    ```
    Or (if name conflicts):
    ```json
    {
        "error": "Bad Request",
        "message": "Product with this name already exists."
    }
    ```

*   **Error Response (404 Not Found):** Product with the given ID does not exist.
    ```json
    {
        "error": "Not Found",
        "message": "Product not found with ID: a1b2c3d4-e5f6-7890-1234-567890abcdef for update."
    }
    ```

*   **Error Response (401 Unauthorized):** Missing or invalid token.

*   **Error Response (403 Forbidden):** User is not an administrator.

### `DELETE /products/{id}`

Deletes a product by its ID.

*   **Authorization:** Required (Admin role only).
*   **Request:**
    *   **Method:** `DELETE`
    *   **Path:** `/api/v1/products/{id}`
    *   **Headers:** `Authorization: Bearer <your_jwt_token>`

*   **Response (204 No Content):**
    *   Successful deletion, no body returned.

*   **Error Response (404 Not Found):** Product with the given ID does not exist.
    ```json
    {
        "error": "Not Found",
        "message": "Product not found with ID: a1b2c3d4-e5f6-7890-1234-567890abcdef for deletion."
    }
    ```

*   **Error Response (401 Unauthorized):** Missing or invalid token.

*   **Error Response (403 Forbidden):** User is not an administrator.

---

## 3. General Error Responses

In addition to specific error messages, the API provides consistent error response formats.

### 429 Too Many Requests

This error occurs when the client exceeds the configured rate limits.

```json
{
    "error": "Too Many Requests",
    "message": "You have exceeded the rate limit. Please try again later."
}
```
**Headers:** `Retry-After: <seconds>` (suggested time to wait before retrying)

### 500 Internal Server Error

This is a generic error for unexpected server-side issues.

```json
{
    "error": "Internal Server Error",
    "message": "An unexpected error occurred: [details of error, if safe to expose]"
}
```
---
```