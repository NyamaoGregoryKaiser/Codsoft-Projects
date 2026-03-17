# CMS System API Documentation

This document describes the RESTful API endpoints provided by the C++ backend of the CMS system.

**Base URL**: `/api/v1`

---

## 1. Authentication Endpoints

### 1.1. Register User
`POST /api/v1/auth/register`

Registers a new user account.
By default, newly registered users get the `USER` role.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "strong_password",
  "role": "USER"  // Optional. Only 'ADMIN' can register other admins.
}
```

**Responses**:
*   `200 OK`:
    ```json
    {
      "message": "User registered successfully",
      "userId": "uuid-of-new-user",
      "email": "user@example.com",
      "role": "USER"
    }
    ```
*   `400 Bad Request`: Invalid input (e.g., missing email/password).
    ```json
    { "error": "Bad request" }
    ```
*   `409 Conflict`: User with this email already exists.
    ```json
    { "error": "User with this email already exists" }
    ```

### 1.2. Login User
`POST /api/v1/auth/login`

Authenticates a user and returns JWT access and refresh tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "strong_password"
}
```

**Responses**:
*   `200 OK`:
    ```json
    {
      "userId": "uuid-of-user",
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "role": "USER"
    }
    ```
*   `400 Bad Request`: Invalid input.
*   `401 Unauthorized`: Invalid email or password.
    ```json
    { "error": "Invalid username or password" }
    ```

### 1.3. Refresh Tokens
`POST /api/v1/auth/refresh`

Generates a new access token and a new refresh token using a valid refresh token. The old refresh token is blacklisted.

**Request Body**:
```json
{
  "refreshToken": "eyJ..."
}
```

**Responses**:
*   `200 OK`:
    ```json
    {
      "userId": "uuid-of-user",
      "accessToken": "eyJ_new...",
      "refreshToken": "eyJ_new_refresh...",
      "role": "USER"
    }
    ```
*   `400 Bad Request`: Missing refresh token.
*   `401 Unauthorized`: Invalid or expired refresh token.
    ```json
    { "error": "Invalid or expired token" }
    ```

### 1.4. Logout User
`POST /api/v1/auth/logout`

Invalidates the current access token and optionally a refresh token.

**Authentication**: Required (Access Token)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Request Body**:
```json
{
  "refreshToken": "eyJ..." // Optional: send refresh token to blacklist it too
}
```

**Responses**:
*   `200 OK`:
    ```json
    { "message": "Logged out successfully." }
    ```
*   `401 Unauthorized`: Missing or invalid access token.

---

## 2. User Management Endpoints

### 2.1. Get All Users
`GET /api/v1/users`

Retrieves a list of all registered users.

**Authentication**: Required (Admin Role)

**Request Headers**:
`Authorization: Bearer <adminAccessToken>`

**Responses**:
*   `200 OK`:
    ```json
    [
      {
        "id": "uuid-1",
        "email": "admin@example.com",
        "role": "ADMIN",
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z"
      },
      {
        "id": "uuid-2",
        "email": "user@example.com",
        "role": "USER",
        "createdAt": "2023-10-27T10:05:00Z",
        "updatedAt": "2023-10-27T10:05:00Z"
      }
    ]
    ```
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not an Admin).

### 2.2. Get User by ID
`GET /api/v1/users/{id}`

Retrieves details of a specific user by their ID.

**Authentication**: Required (Admin Role)

**Request Headers**:
`Authorization: Bearer <adminAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the user.

**Responses**:
*   `200 OK`: (Same as single user object in `Get All Users` response)
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not an Admin).
*   `404 Not Found`: User not found.

### 2.3. Get User Profile (Self)
`GET /api/v1/users/profile`

Retrieves details of the authenticated user.

**Authentication**: Required (Any Authenticated Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Responses**:
*   `200 OK`: (Same as single user object in `Get All Users` response)
*   `401 Unauthorized`: Missing or invalid access token.

### 2.4. Update User by ID
`PUT /api/v1/users/{id}`

Updates details of a specific user.

**Authentication**: Required (Admin Role)

**Request Headers**:
`Authorization: Bearer <adminAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the user to update.

**Request Body**:
```json
{
  "email": "new_email@example.com",     // Optional
  "password": "new_strong_password",  // Optional
  "role": "EDITOR"                    // Optional, update user's role
}
```

**Responses**:
*   `200 OK`: User updated successfully.
*   `400 Bad Request`: Invalid input.
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not an Admin).
*   `404 Not Found`: User not found.
*   `409 Conflict`: New email already in use.

### 2.5. Delete User by ID
`DELETE /api/v1/users/{id}`

Deletes a user account.

**Authentication**: Required (Admin Role)

**Request Headers**:
`Authorization: Bearer <adminAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the user to delete.

**Responses**:
*   `200 OK`:
    ```json
    { "message": "User deleted successfully." }
    ```
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not an Admin, or attempting to delete self).
*   `404 Not Found`: User not found.

---

## 3. Category Management Endpoints

### 3.1. Create Category
`POST /api/v1/categories`

Creates a new content category.

**Authentication**: Required (Admin or Editor Role)

**Request Headers**:
`Authorization: Bearer <adminOrEditorAccessToken>`

**Request Body**:
```json
{
  "name": "New Category Name",
  "description": "Optional description for the category." // Optional
}
```

**Responses**:
*   `200 OK`:
    ```json
    {
      "id": "uuid-of-category",
      "name": "New Category Name",
      "slug": "new-category-name-slug",
      "description": "Optional description for the category.",
      "createdAt": "2023-10-27T10:30:00Z",
      "updatedAt": "2023-10-27T10:30:00Z"
    }
    ```
*   `400 Bad Request`: Invalid input (e.g., missing name).
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions.
*   `409 Conflict`: Category with this name already exists.

### 3.2. Get All Categories
`GET /api/v1/categories`

Retrieves a list of all categories.

**Authentication**: Required (Any Authenticated Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Responses**:
*   `200 OK`:
    ```json
    [
      {
        "id": "uuid-of-category-1",
        "name": "Technology",
        "slug": "technology",
        "description": "Articles about software, hardware, and innovation.",
        "createdAt": "2023-10-27T10:00:00Z",
        "updatedAt": "2023-10-27T10:00:00Z"
      }
    ]
    ```
*   `401 Unauthorized`: Missing or invalid access token.

### 3.3. Get Category by ID
`GET /api/v1/categories/{id}`

Retrieves details of a specific category.

**Authentication**: Required (Any Authenticated Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Path Parameters**:
*   `id`: The UUID of the category.

**Responses**:
*   `200 OK`: (Single category object)
*   `401 Unauthorized`: Missing or invalid access token.
*   `404 Not Found`: Category not found.

### 3.4. Update Category by ID
`PUT /api/v1/categories/{id}`

Updates an existing category.

**Authentication**: Required (Admin or Editor Role)

**Request Headers**:
`Authorization: Bearer <adminOrEditorAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the category to update.

**Request Body**:
```json
{
  "name": "Updated Category Name",        // Optional
  "description": "New description." // Optional
}
```

**Responses**:
*   `200 OK`: Category updated successfully.
*   `400 Bad Request`: Invalid input.
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions.
*   `404 Not Found`: Category not found.
*   `409 Conflict`: New name already in use by another category.

### 3.5. Delete Category by ID
`DELETE /api/v1/categories/{id}`

Deletes a category. Note: Posts associated with this category might have their `category_id` set to NULL or be restricted by DB constraints (e.g., `ON DELETE RESTRICT`).

**Authentication**: Required (Admin or Editor Role)

**Request Headers**:
`Authorization: Bearer <adminOrEditorAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the category to delete.

**Responses**:
*   `200 OK`:
    ```json
    { "message": "Category deleted successfully." }
    ```
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions.
*   `404 Not Found`: Category not found.

---

## 4. Post Management Endpoints

### 4.1. Create Post
`POST /api/v1/posts`

Creates a new post. It starts as a `DRAFT` by default.

**Authentication**: Required (Any Authenticated Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Request Body**:
```json
{
  "title": "My New Article",
  "content": "This is the compelling content of my new article.",
  "categoryId": "uuid-of-category" // Optional
}
```

**Responses**:
*   `200 OK`:
    ```json
    {
      "id": "uuid-of-post",
      "title": "My New Article",
      "content": "This is the compelling content of my new article.",
      "slug": "my-new-article-slug",
      "status": "DRAFT",
      "authorId": "uuid-of-author",
      "categoryId": "uuid-of-category",
      "publishedAt": "",
      "createdAt": "2023-10-27T11:00:00Z",
      "updatedAt": "2023-10-27T11:00:00Z"
    }
    ```
*   `400 Bad Request`: Invalid input (e.g., missing title/content, invalid category ID).
*   `401 Unauthorized`: Missing or invalid access token.

### 4.2. Get All Posts
`GET /api/v1/posts`

Retrieves a list of posts.
*   **Public Access**: If no `Authorization` header, returns only `PUBLISHED` posts.
*   **Authenticated Access**: Returns `PUBLISHED` posts and all posts authored by the authenticated user (regardless of status).

**Authentication**: Optional

**Request Headers**:
`Authorization: Bearer <accessToken>` (Optional)

**Query Parameters (Example)**:
*   `status`: Filter by post status (e.g., `status=DRAFT`). (Requires authentication and appropriate role)
*   `authorId`: Filter by author ID. (Requires authentication and appropriate role)
*   `categoryId`: Filter by category ID.

**Responses**:
*   `200 OK`:
    ```json
    [
      {
        "id": "uuid-of-post-1",
        "title": "Published Article",
        "content": "Content...",
        "slug": "published-article",
        "status": "PUBLISHED",
        "authorId": "uuid-of-author",
        "categoryId": "uuid-of-category",
        "publishedAt": "2023-10-27T11:30:00Z",
        "createdAt": "2023-10-27T11:00:00Z",
        "updatedAt": "2023-10-27T11:30:00Z"
      }
      // ... more posts
    ]
    ```

### 4.3. Get Post by ID
`GET /api/v1/posts/{id}`

Retrieves details of a specific post.
*   **Public Access**: Returns `PUBLISHED` posts only.
*   **Authenticated Access**: Returns `PUBLISHED` posts, or any post if the user is the author, an Admin, or an Editor.

**Authentication**: Optional

**Request Headers**:
`Authorization: Bearer <accessToken>` (Optional)

**Path Parameters**:
*   `id`: The UUID of the post.

**Responses**:
*   `200 OK`: (Single post object)
*   `401 Unauthorized`: Invalid access token (if provided).
*   `404 Not Found`: Post not found, or not authorized to view.

### 4.4. Update Post by ID
`PUT /api/v1/posts/{id}`

Updates an existing post.

**Authentication**: Required (Author of the post, or Admin/Editor Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Path Parameters**:
*   `id`: The UUID of the post to update.

**Request Body**:
```json
{
  "title": "Updated Article Title",
  "content": "New updated content.",
  "categoryId": "uuid-of-new-category", // Change category
  "slug": "updated-article-slug"      // Update slug
  // "status": "PENDING_REVIEW" // Only Admin/Editor can change status via this endpoint
}
```

**Responses**:
*   `200 OK`: Post updated successfully.
*   `400 Bad Request`: Invalid input (e.g., invalid category ID).
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not the author, nor Admin/Editor, or unauthorized status change).
*   `404 Not Found`: Post not found.

### 4.5. Delete Post by ID
`DELETE /api/v1/posts/{id}`

Deletes a post.

**Authentication**: Required (Author of the post, or Admin/Editor Role)

**Request Headers**:
`Authorization: Bearer <accessToken>`

**Path Parameters**:
*   `id`: The UUID of the post to delete.

**Responses**:
*   `200 OK`:
    ```json
    { "message": "Post deleted successfully." }
    ```
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions (not the author, nor Admin/Editor).
*   `404 Not Found`: Post not found.

### 4.6. Publish Post
`POST /api/v1/posts/{id}/publish`

Sets the status of a post to `PUBLISHED` and records `publishedAt` timestamp.

**Authentication**: Required (Admin or Editor Role)

**Request Headers**:
`Authorization: Bearer <adminOrEditorAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the post to publish.

**Responses**:
*   `200 OK`: Post published successfully (or already published).
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions.
*   `404 Not Found`: Post not found.

### 4.7. Draft Post
`POST /api/v1/posts/{id}/draft`

Sets the status of a post back to `DRAFT` and clears `publishedAt` timestamp.

**Authentication**: Required (Admin or Editor Role)

**Request Headers**:
`Authorization: Bearer <adminOrEditorAccessToken>`

**Path Parameters**:
*   `id`: The UUID of the post to draft.

**Responses**:
*   `200 OK`: Post set to draft successfully (or already a draft).
*   `401 Unauthorized`: Missing or invalid access token.
*   `403 Forbidden`: Insufficient permissions.
*   `404 Not Found`: Post not found.
```