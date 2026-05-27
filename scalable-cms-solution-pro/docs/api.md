```markdown
# ECM CMS API Documentation (v1)

This document provides an overview of the RESTful API endpoints for the Enterprise Content Manager (ECM) CMS.
For an interactive API explorer, please visit `/api/v1/docs` on the running development server.

**Base URL:** `/api/v1`

---

## Authentication

Authentication is performed using JSON Web Tokens (JWT). A `Bearer` token must be included in the `Authorization` header for protected routes.

### `POST /auth/register`

Register a new user account. Default role for new users is `author`.

*   **Request Body (JSON):**
    ```json
    {
      "username": "yourusername",
      "email": "your@example.com",
      "password": "yourpassword"
    }
    ```
*   **Responses:**
    *   `201 Created`: User registered successfully. Returns `token` and `user` object.
        ```json
        {
          "message": "User registered successfully",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": {
            "id": "uuid",
            "username": "yourusername",
            "email": "your@example.com",
            "role": "author",
            "createdAt": "datetime",
            "updatedAt": "datetime"
          }
        }
        ```
    *   `400 Bad Request`: Email or username already taken, or validation error.

### `POST /auth/login`

Authenticate an existing user and obtain a JWT token.

*   **Request Body (JSON):**
    ```json
    {
      "email": "your@example.com",
      "password": "yourpassword"
    }
    ```
*   **Responses:**
    *   `200 OK`: Login successful. Returns `token` and `user` object.
        ```json
        {
          "message": "Logged in successfully",
          "token": "eyJhbGciOiJIUzI1Ni...",
          "user": {
            "id": "uuid",
            "username": "yourusername",
            "email": "your@example.com",
            "role": "admin",
            "createdAt": "datetime",
            "updatedAt": "datetime"
          }
        }
        ```
    *   `401 Unauthorized`: Incorrect email or password.

---

## Users

Requires authentication for all endpoints. Some endpoints require specific roles (`admin`, `editor`).

### `GET /users`

Retrieve a paginated list of all users.
**Required Roles:** `admin`, `editor`

*   **Query Parameters:**
    *   `page` (optional, default: 1): Page number.
    *   `limit` (optional, default: 10): Number of items per page.
*   **Responses:**
    *   `200 OK`: List of users.
        ```json
        {
          "users": [ { ...User object without password... } ],
          "totalUsers": 1,
          "totalPages": 1,
          "currentPage": 1
        }
        ```
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: User does not have required role.

### `GET /users/me`

Retrieve the profile of the currently authenticated user.

*   **Responses:**
    *   `200 OK`: Current user's profile.
        ```json
        {
          "id": "uuid",
          "username": "currentuser",
          "email": "current@example.com",
          "role": "author",
          "createdAt": "datetime",
          "updatedAt": "datetime"
        }
        ```
    *   `401 Unauthorized`: No token or invalid token.

### `GET /users/{id}`

Retrieve a specific user by ID.
**Required Roles:** `admin`, `editor` (or if `id` matches authenticated user's ID for self-view)

*   **Path Parameters:**
    *   `id` (UUID): The ID of the user.
*   **Responses:**
    *   `200 OK`: User profile.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: User does not have required role.
    *   `404 Not Found`: User not found.

### `PUT /users/{id}`

Update a user's profile.
**Required Roles:** Authenticated user can update their own profile. `admin` can update any user (including roles). `editor` can update any user except their role.

*   **Path Parameters:**
    *   `id` (UUID): The ID of the user to update.
*   **Request Body (JSON):**
    ```json
    {
      "username": "newusername",
      "email": "new@example.com",
      "password": "newpassword",
      "role": "admin" # Only admins can change roles
    }
    ```
*   **Responses:**
    *   `200 OK`: User updated successfully.
    *   `400 Bad Request`: Validation error, email/username taken.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role or not authorized to update.
    *   `404 Not Found`: User not found.

### `DELETE /users/{id}`

Delete a user.
**Required Roles:** `admin`

*   **Path Parameters:**
    *   `id` (UUID): The ID of the user to delete.
*   **Responses:**
    *   `204 No Content`: User deleted successfully.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.
    *   `404 Not Found`: User not found.

---

## Posts

### `GET /posts`

Retrieve a paginated list of posts.

*   **Query Parameters:**
    *   `page` (optional, default: 1): Page number.
    *   `limit` (optional, default: 10): Number of items per page.
    *   `category` (optional, string): Filter by category slug.
    *   `search` (optional, string): Search by title or content (case-insensitive).
    *   `status` (optional, enum: `draft`, `published`, `archived`): Filter by post status.
*   **Responses:**
    *   `200 OK`: List of posts, including author and category details.
        ```json
        {
          "posts": [ { ...Post object... } ],
          "totalPosts": 2,
          "totalPages": 1,
          "currentPage": 1
        }
        ```

### `GET /posts/{id}`

Retrieve a single post by ID.

*   **Path Parameters:**
    *   `id` (UUID): The ID of the post.
*   **Responses:**
    *   `200 OK`: Post details, including author and category.
    *   `404 Not Found`: Post not found.

### `POST /posts`

Create a new post.
**Required Roles:** `admin`, `editor`, `author`

*   **Request Body (multipart/form-data):**
    *   `title` (string, required): Title of the post.
    *   `content` (string, required): Full content of the post.
    *   `excerpt` (string, optional): Short summary of the post.
    *   `slug` (string, optional): SEO-friendly URL slug. Auto-generated from title if not provided.
    *   `status` (enum: `draft`, `published`, `archived`, optional, default: `draft`): Post status.
    *   `categoryId` (UUID, optional): ID of the category.
    *   `featuredImage` (file, optional): An image file to be set as the featured image.
*   **Responses:**
    *   `201 Created`: Post created successfully.
    *   `400 Bad Request`: Validation error or category not found.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.

### `PUT /posts/{id}`

Update an existing post.
**Required Roles:** `admin`, `editor` (any post); `author` (only their own posts).

*   **Path Parameters:**
    *   `id` (UUID): The ID of the post to update.
*   **Request Body (multipart/form-data):**
    *   `title` (string, optional): New title.
    *   `content` (string, optional): New content.
    *   `excerpt` (string, optional): New excerpt.
    *   `slug` (string, optional): New slug.
    *   `status` (enum: `draft`, `published`, `archived`, optional): New status.
    *   `categoryId` (UUID, optional): New category ID.
    *   `featuredImage` (file, optional): New featured image file. Will replace existing.
    *   `removeFeaturedImage` (boolean, optional): Set to `true` to remove the existing featured image.
*   **Responses:**
    *   `200 OK`: Post updated successfully.
    *   `400 Bad Request`: Validation error or category not found.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role or not authorized to update this post.
    *   `404 Not Found`: Post not found.

### `DELETE /posts/{id}`

Delete a post.
**Required Roles:** `admin`, `editor` (any post); `author` (only their own posts).

*   **Path Parameters:**
    *   `id` (UUID): The ID of the post to delete.
*   **Responses:**
    *   `204 No Content`: Post deleted successfully.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role or not authorized to delete this post.
    *   `404 Not Found`: Post not found.

---

## Categories

### `GET /categories`

Retrieve a list of all categories.

*   **Responses:**
    *   `200 OK`: List of categories.
        ```json
        [
          {
            "id": "uuid",
            "name": "Technology",
            "slug": "technology",
            "description": "Articles about tech.",
            "createdAt": "datetime",
            "updatedAt": "datetime"
          }
        ]
        ```

### `GET /categories/{idOrSlug}`

Retrieve a single category by ID or slug.

*   **Path Parameters:**
    *   `idOrSlug` (string): The ID (UUID) or slug of the category.
*   **Responses:**
    *   `200 OK`: Category details.
    *   `404 Not Found`: Category not found.

### `POST /categories`

Create a new category.
**Required Roles:** `admin`, `editor`

*   **Request Body (JSON):**
    ```json
    {
      "name": "New Category Name",
      "description": "Description for the new category."
    }
    ```
*   **Responses:**
    *   `201 Created`: Category created successfully.
    *   `400 Bad Request`: Validation error or name/slug already exists.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.

### `PUT /categories/{id}`

Update an existing category.
**Required Roles:** `admin`, `editor`

*   **Path Parameters:**
    *   `id` (UUID): The ID of the category to update.
*   **Request Body (JSON):**
    ```json
    {
      "name": "Updated Category Name",
      "description": "Updated description."
    }
    ```
*   **Responses:**
    *   `200 OK`: Category updated successfully.
    *   `400 Bad Request`: Validation error or name/slug already exists.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.
    *   `404 Not Found`: Category not found.

### `DELETE /categories/{id}`

Delete a category.
**Required Roles:** `admin`, `editor`

*   **Path Parameters:**
    *   `id` (UUID): The ID of the category to delete.
*   **Responses:**
    *   `204 No Content`: Category deleted successfully.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.
    *   `404 Not Found`: Category not found.

---

## Media

### `GET /media`

Retrieve a list of all uploaded media files.
**Required Roles:** `admin`, `editor`, `author`

*   **Responses:**
    *   `200 OK`: List of media files.
        ```json
        [
          {
            "id": "uuid",
            "filename": "image.jpg",
            "originalName": "my_holiday_pic.jpg",
            "mimeType": "image/jpeg",
            "size": 123456,
            "path": "/uploads/media/image-167890.jpg",
            "uploadedBy": "uuid",
            "createdAt": "datetime",
            "updatedAt": "datetime"
          }
        ]
        ```
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.

### `POST /media`

Upload one or more media files.
**Required Roles:** `admin`, `editor`, `author`

*   **Request Body (multipart/form-data):**
    *   `files` (array of files, required): One or more files to upload.
*   **Responses:**
    *   `201 Created`: Files uploaded successfully. Returns an array of created media objects.
    *   `400 Bad Request`: No files uploaded or invalid file type.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role.

### `DELETE /media/{id}`

Delete a media file. This will also remove the file from storage.
**Required Roles:** `admin`, `editor`, `author` (authors can only delete their own uploaded media)

*   **Path Parameters:**
    *   `id` (UUID): The ID of the media file to delete.
*   **Responses:**
    *   `204 No Content`: Media file deleted successfully.
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: Insufficient role or not authorized to delete this media.
    *   `404 Not Found`: Media file not found.
```