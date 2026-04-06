# CMS System API Documentation

This document provides a detailed overview of the RESTful API endpoints available in the CMS System.

## Base URL
`http://localhost:8080/api` (for local development)

## Authentication

The API uses **JSON Web Tokens (JWT)** for authentication.
1.  Obtain a JWT by sending a `POST` request to `/api/auth/signin`.
2.  Include the token in the `Authorization` header of subsequent requests: `Authorization: Bearer <YOUR_JWT_TOKEN>`.

### 1. Authentication Endpoints

#### `POST /api/auth/signin`
Authenticate a user and obtain a JWT token.
*   **Request Body:**
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```
*   **Response:**
    *   `200 OK`:
        ```json
        {
            "token": "eyJhbGciOiJIUzI1Ni...",
            "type": "Bearer",
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "roles": ["ROLE_ADMIN", "ROLE_EDITOR", "ROLE_USER"]
        }
        ```
    *   `401 Unauthorized`: Invalid credentials.

#### `POST /api/auth/signup`
Register a new user.
*   **Request Body:**
    ```json
    {
        "username": "new_user",
        "email": "newuser@example.com",
        "password": "strong_password",
        "roles": ["ROLE_USER"] // Optional, defaults to ROLE_USER
    }
    ```
*   **Response:**
    *   `201 Created`: `User registered successfully!`
    *   `400 Bad Request`: Validation errors or username/email already exists.

#### `POST /api/auth/signout`
Invalidate the JWT token (by clearing the HTTP-only cookie if used).
*   **Response:**
    *   `200 OK`: `You've been signed out!`

---

### 2. User Management Endpoints (Admin Only)

**Base Path:** `/api/admin/users`
**Required Role:** `ROLE_ADMIN`

#### `POST /api/admin/users`
Create a new user.
*   **Request Body:** `UserRequest` (same as signup, but usually by an admin)
*   **Response:** `201 Created`, `UserDto`

#### `GET /api/admin/users/{id}`
Get a user by ID.
*   **Response:** `200 OK`, `UserDto`
*   `404 Not Found`: User not found.

#### `GET /api/admin/users`
Get all users with pagination.
*   **Query Parameters:**
    *   `page` (int, default: 0)
    *   `size` (int, default: 10)
    *   `sort` (string, default: `createdAt,desc`)
*   **Response:** `200 OK`, `Page<UserDto>`

#### `PUT /api/admin/users/{id}`
Update an existing user.
*   **Request Body:** `UserRequest` (partial updates are supported)
*   **Response:** `200 OK`, `UserDto`
*   `404 Not Found`: User not found.
*   `400 Bad Request`: Validation errors or conflict.

#### `DELETE /api/admin/users/{id}`
Delete a user by ID.
*   **Response:** `204 No Content`
*   `404 Not Found`: User not found.

---

### 3. Category Management Endpoints

**Base Path:** `/api/categories`
**Required Roles:**
*   `POST`, `PUT`, `DELETE`: `ROLE_ADMIN`, `ROLE_EDITOR`
*   `GET`: `ROLE_ADMIN`, `ROLE_EDITOR`, `ROLE_USER`

#### `POST /api/categories`
Create a new category.
*   **Request Body:** `CategoryRequest`
    ```json
    {
        "name": "Technology",
        "description": "Articles about technology trends and gadgets"
    }
    ```
*   **Response:** `201 Created`, `CategoryDto`
*   `400 Bad Request`: Validation errors or category name already exists.

#### `GET /api/categories/{id}`
Get a category by ID.
*   **Response:** `200 OK`, `CategoryDto`
*   `404 Not Found`: Category not found.

#### `GET /api/categories`
Get all categories with pagination.
*   **Query Parameters:** `page`, `size`, `sort`
*   **Response:** `200 OK`, `Page<CategoryDto>`

#### `PUT /api/categories/{id}`
Update an existing category.
*   **Request Body:** `CategoryRequest` (partial updates)
*   **Response:** `200 OK`, `CategoryDto`
*   `404 Not Found`: Category not found.
*   `400 Bad Request`: Validation errors or conflict.

#### `DELETE /api/categories/{id}`
Delete a category by ID.
*   **Response:** `204 No Content`
*   `404 Not Found`: Category not found.

---

### 4. Content Management Endpoints

**Base Path:** `/api/content`
**Required Roles:**
*   `POST`, `PUT`, `DELETE`: `ROLE_ADMIN`, `ROLE_EDITOR`
*   `GET`: Any authenticated user (or public for published content if configured)

#### `POST /api/content`
Create new content.
*   **Request Body:** `ContentCreateRequest`
    ```json
    {
        "title": "Introduction to Spring Boot",
        "body": "Detailed article on getting started with Spring Boot...",
        "slug": "introduction-to-spring-boot", // Optional, will be auto-generated if not provided
        "categoryId": 1,
        "status": "DRAFT" // or "PUBLISHED", "ARCHIVED"
    }
    ```
*   **Response:** `201 Created`, `ContentDto`
*   `400 Bad Request`: Validation errors or category not found.

#### `GET /api/content/{id}`
Get content by ID.
*   **Response:** `200 OK`, `ContentDto`
*   `404 Not Found`: Content not found.

#### `GET /api/content/slug/{slug}`
Get content by slug.
*   **Response:** `200 OK`, `ContentDto`
*   `404 Not Found`: Content not found.

#### `GET /api/content`
Get all content with pagination.
*   **Query Parameters:**
    *   `page` (int, default: 0)
    *   `size` (int, default: 10)
    *   `sort` (string, default: `createdAt,desc`)
    *   `status` (enum: `DRAFT`, `PUBLISHED`, `ARCHIVED`, optional) - filters content by status.
*   **Response:** `200 OK`, `Page<ContentDto>`

#### `PUT /api/content/{id}`
Update existing content.
*   **Request Body:** `ContentUpdateRequest` (partial updates)
*   **Response:** `200 OK`, `ContentDto`
*   `404 Not Found`: Content not found.
*   `400 Bad Request`: Validation errors or category not found.

#### `DELETE /api/content/{id}`
Delete content by ID.
*   **Response:** `204 No Content`
*   `404 Not Found`: Content not found.

---

### 5. Error Responses

In case of an error, the API will return a JSON object with details:

```json
{
    "timestamp": "2023-10-27T10:30:45.123456",
    "message": "Error message description",
    "details": "uri=/api/content/999",
    "status": 404
}
```

*   `400 Bad Request`: Invalid request payload or business rule violation.
*   `401 Unauthorized`: Authentication failed (invalid/missing token).
*   `403 Forbidden`: User does not have necessary permissions.
*   `404 Not Found`: Resource not found.
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Unexpected server error.

---

### 6. Pagination & Sorting

Most `GET` endpoints that return lists support pagination and sorting via query parameters:
*   `page`: Zero-based page index (e.g., `0` for the first page).
*   `size`: Number of records per page (e.g., `10`).
*   `sort`: Comma-separated list of properties to sort by, with an optional direction. E.g., `sort=title,asc` or `sort=createdAt,desc`.

Example: `GET /api/content?page=0&size=5&sort=title,asc`

---

### 7. Rate Limiting

API endpoints are rate-limited to prevent abuse.
*   **Limit:** 10 requests per minute per IP address.
*   **Response on Exceeding Limit:** `429 Too Many Requests` with a message.