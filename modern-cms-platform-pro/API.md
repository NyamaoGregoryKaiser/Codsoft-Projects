# CMS-CPP API Documentation

This document outlines the RESTful API endpoints for the C++ Content Management System. All endpoints are prefixed with `/api/v1`.

## Authentication

All protected endpoints require a JWT token in the `Authorization` header: `Authorization: Bearer <token>`.

### 1. Register User

*   **URL:** `/api/v1/auth/register`
*   **Method:** `POST`
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
        "username": "unique_username",
        "email": "user@example.com",
        "password": "strong_password"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
        "status": "success",
        "code": 201,
        "message": "User registered successfully.",
        "data": {
            "user_id": "uuid",
            "username": "unique_username",
            "email": "user@example.com",
            "token": "jwt_token_string"
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing fields or invalid input.
    *   `409 Conflict`: Username or email already exists.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 2. Login User

*   **URL:** `/api/v1/auth/login`
*   **Method:** `POST`
*   **Description:** Authenticates a user and returns a JWT token.
*   **Request Body:**
    ```json
    {
        "username": "user_or_email",
        "password": "your_password"
    }
    ```
    OR
    ```json
    {
        "email": "user@example.com",
        "password": "your_password"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "Login successful.",
        "data": {
            "user_id": "uuid",
            "username": "logged_in_username",
            "email": "logged_in_email",
            "role": "user_role",
            "token": "jwt_token_string"
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing fields or invalid input.
    *   `401 Unauthorized`: Invalid credentials.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

## Content Management

### 3. Get All Content

*   **URL:** `/api/v1/content`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all content items.
*   **Authentication:** Optional (can be accessed publicly).
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "Content retrieved successfully.",
        "data": [
            {
                "id": "uuid",
                "title": "Article Title",
                "slug": "article-title",
                "body": "Full article body...",
                "author_id": "uuid_of_author",
                "status": "published",
                "created_at": "timestamp",
                "updated_at": "timestamp",
                "published_at": "timestamp"
            }
            // ... more content objects
        ]
    }
    ```
*   **Error Responses:**
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 4. Get Content by ID

*   **URL:** `/api/v1/content/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single content item by its ID.
*   **Authentication:** Optional (can be accessed publicly).
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the content.
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "Content retrieved successfully.",
        "data": {
            "id": "uuid",
            "title": "Article Title",
            "slug": "article-title",
            "body": "Full article body...",
            "author_id": "uuid_of_author",
            "status": "published",
            "created_at": "timestamp",
            "updated_at": "timestamp",
            "published_at": "timestamp"
        }
    }
    ```
*   **Error Responses:**
    *   `404 Not Found`: Content with the specified ID does not exist.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 5. Create Content

*   **URL:** `/api/v1/content`
*   **Method:** `POST`
*   **Description:** Creates a new content item. The `author_id` is automatically extracted from the JWT.
*   **Authentication:** Required (User or Admin).
*   **Request Body:**
    ```json
    {
        "title": "New Article Title",
        "body": "The full content of the new article.",
        "status": "draft" // Optional: "published", "draft", "archived" (default: "draft")
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
        "status": "success",
        "code": 201,
        "message": "Content created successfully.",
        "data": {
            "id": "new_uuid",
            "title": "New Article Title",
            "slug": "new-article-title",
            "body": "The full content of the new article.",
            "author_id": "uuid_of_creator",
            "status": "draft",
            "created_at": "timestamp",
            "updated_at": "timestamp",
            "published_at": null
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `title` or `body`.
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User not authorized (e.g., token payload incomplete).
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 6. Update Content

*   **URL:** `/api/v1/content/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing content item. Only the author of the content or an admin can update it.
*   **Authentication:** Required (User or Admin).
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the content to update.
*   **Request Body:**
    ```json
    {
        "title": "Updated Article Title",         // Optional
        "body": "Updated content of the article.", // Optional
        "status": "published"                   // Optional: "published", "draft", "archived"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "Content updated successfully.",
        "data": {
            "id": "uuid",
            "title": "Updated Article Title",
            "slug": "updated-article-title",
            "body": "Updated content of the article.",
            "author_id": "uuid_of_author",
            "status": "published",
            "created_at": "timestamp",
            "updated_at": "timestamp",
            "published_at": "timestamp"
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid JSON payload or no valid fields for update.
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User not authorized to update this content (not the author or not admin).
    *   `404 Not Found`: Content with the specified ID does not exist or user not authorized.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 7. Delete Content

*   **URL:** `/api/v1/content/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes a content item. Only the author of the content or an admin can delete it.
*   **Authentication:** Required (User or Admin).
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the content to delete.
*   **Success Response (204 No Content):**
    *   No content in the response body.
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User not authorized to delete this content (not the author or not admin).
    *   `404 Not Found`: Content with the specified ID does not exist or user not authorized.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

## User Management (Admin Only)

### 8. Get All Users

*   **URL:** `/api/v1/users`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all registered users.
*   **Authentication:** Required (Admin only).
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "Users retrieved successfully.",
        "data": [
            {
                "id": "uuid",
                "username": "user1",
                "email": "user1@example.com",
                "role": "user",
                "created_at": "timestamp",
                "updated_at": "timestamp"
            }
            // ... more user objects
        ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User is not an admin.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 9. Get User by ID

*   **URL:** `/api/v1/users/{id}`
*   **Method:** `GET`
*   **Description:** Retrieves a single user by their ID. Accessible by admin or the user themselves.
*   **Authentication:** Required (Admin or the user whose ID matches).
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the user.
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "User retrieved successfully.",
        "data": {
            "id": "uuid",
            "username": "target_user",
            "email": "target@example.com",
            "role": "user",
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User is not an admin and not requesting their own profile.
    *   `404 Not Found`: User with the specified ID does not exist.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 10. Update User

*   **URL:** `/api/v1/users/{id}`
*   **Method:** `PUT`
*   **Description:** Updates an existing user's information. Accessible by admin or the user themselves. Non-admin users cannot change their role.
*   **Authentication:** Required (Admin or the user whose ID matches).
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the user to update.
*   **Request Body:**
    ```json
    {
        "username": "new_username",          // Optional
        "email": "new_email@example.com",    // Optional
        "password": "new_strong_password",   // Optional
        "role": "admin"                     // Optional, only if authenticated user is admin
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "code": 200,
        "message": "User updated successfully.",
        "data": {
            "id": "uuid",
            "username": "new_username",
            "email": "new_email@example.com",
            "role": "admin",
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid JSON payload or no valid fields for update.
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User not authorized to update (not admin or trying to change role as non-admin).
    *   `404 Not Found`: User with the specified ID does not exist.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---

### 11. Delete User

*   **URL:** `/api/v1/users/{id}`
*   **Method:** `DELETE`
*   **Description:** Deletes a user account.
*   **Authentication:** Required (Admin only). An admin cannot delete their own account.
*   **Path Parameters:**
    *   `id` (string, UUID): The unique identifier of the user to delete.
*   **Success Response (204 No Content):**
    *   No content in the response body.
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid JWT token.
    *   `403 Forbidden`: User is not an admin, or an admin is trying to delete their own account.
    *   `404 Not Found`: User with the specified ID does not exist.
    *   `429 Too Many Requests`: Rate limit exceeded.
    *   `500 Internal Server Error`: Database error or unexpected server issue.

---