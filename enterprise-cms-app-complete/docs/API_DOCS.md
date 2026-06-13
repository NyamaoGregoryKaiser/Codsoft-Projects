# CMS Backend API Documentation

This document describes the RESTful API endpoints for the CMS backend.

**Base URL:** `http://localhost:5000/api` (or your deployed backend URL)

## Authentication

All protected endpoints require a JWT in the `Authorization` header: `Authorization: Bearer <token>`.

### 1. Register User

*   **`POST /auth/register`**
    *   **Description:** Registers a new user. Only admins can assign roles other than 'subscriber'.
    *   **Request Body:**
        ```json
        {
          "username": "string",
          "email": "string (email format)",
          "password": "string (min 8 chars)",
          "role": "string (optional, 'admin'|'editor'|'author'|'subscriber', default 'subscriber'). Admin-only field."
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
          "status": "success",
          "message": "User registered successfully",
          "data": {
            "user": {
              "id": "uuid",
              "username": "string",
              "email": "string",
              "role": "string"
            },
            "token": "string (JWT)"
          }
        }
        ```
    *   **Error Responses (400 Bad Request, 403 Forbidden):**
        ```json
        {
          "status": "error",
          "code": 400,
          "message": "User with this email already exists."
        }
        ```

### 2. Login User

*   **`POST /auth/login`**
    *   **Description:** Authenticates a user and returns a JWT.
    *   **Request Body:**
        ```json
        {
          "email": "string (email format)",
          "password": "string"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Logged in successfully",
          "data": {
            "user": {
              "id": "uuid",
              "username": "string",
              "email": "string",
              "role": "string"
            },
            "token": "string (JWT)"
          }
        }
        ```
    *   **Error Responses (401 Unauthorized, 400 Bad Request):**
        ```json
        {
          "status": "error",
          "code": 401,
          "message": "Invalid credentials"
        }
        ```

### 3. Get Authenticated User Profile

*   **`GET /auth/me`**
    *   **Description:** Returns the profile of the currently authenticated user.
    *   **Authentication:** Required
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "role": "string",
            "status": "string",
            "createdAt": "date",
            "updatedAt": "date",
            "lastLogin": "date"
          }
        }
        ```
    *   **Error Responses (401 Unauthorized, 403 Forbidden):** Standard authentication errors.

---

## User Management (Admin Only, generally)

### 1. Get All Users

*   **`GET /users`**
    *   **Description:** Retrieves a list of all users.
    *   **Authentication:** Required
    *   **Authorization:** `admin`
    *   **Query Parameters:**
        *   `limit` (number, default 10)
        *   `offset` (number, default 0)
        *   `role` (string, optional: 'admin'|'editor'|'author'|'subscriber')
        *   `status` (string, optional: 'active'|'inactive'|'suspended')
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": [
            { "id": "uuid", "username": "string", "email": "string", "role": "string", "status": "string", "createdAt": "date", "updatedAt": "date" }
          ],
          "meta": { "total": 100, "limit": 10, "offset": 0 }
        }
        ```

### 2. Get User by ID

*   **`GET /users/:id`**
    *   **Description:** Retrieves a single user's profile by ID.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author` (can view profiles, though specific data might be restricted in practice).
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": { "id": "uuid", "username": "string", "email": "string", "role": "string", "status": "string", "createdAt": "date", "updatedAt": "date", "lastLogin": "date" }
        }
        ```
    *   **Error Responses (404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 404,
          "message": "User not found."
        }
        ```

### 3. Update User by ID

*   **`PUT /users/:id`**
    *   **Description:** Updates a user's information. Admins can update any user; other roles can only update their own profile (limited fields).
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`, `subscriber` (self-update)
    *   **Request Body:**
        ```json
        {
          "username": "string (optional)",
          "email": "string (email format, optional)",
          "password": "string (min 8 chars, optional)",
          "role": "string (optional, 'admin'|'editor'|'author'|'subscriber', Admin-only)",
          "status": "string (optional, 'active'|'inactive'|'suspended', Admin-only)"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "User updated successfully",
          "data": { /* updated user object */ }
        }
        ```
    *   **Error Responses (400 Bad Request, 403 Forbidden, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 403,
          "message": "Forbidden: You cannot change your own role."
        }
        ```

### 4. Delete User by ID

*   **`DELETE /users/:id`**
    *   **Description:** Deletes a user. Admins can delete any user except themselves (if they are the last admin). Non-admins can only delete their own account (if allowed, currently only by admin).
    *   **Authentication:** Required
    *   **Authorization:** `admin`
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "User deleted successfully."
        }
        ```
    *   **Error Responses (403 Forbidden, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 403,
          "message": "Forbidden: Cannot delete the last admin user, or self-delete as an admin."
        }
        ```

---

## Post Management

### 1. Get All Posts

*   **`GET /posts`**
    *   **Description:** Retrieves a list of posts. Public users see only `published` posts. Authenticated users (`admin`, `editor`, `author`) can see `draft` posts if specified in query, and potentially filter by `authorId`.
    *   **Authentication:** Optional (affects visibility of drafts)
    *   **Query Parameters:**
        *   `limit` (number, default 10)
        *   `offset` (number, default 0)
        *   `status` (string, optional: 'draft'|'published'|'archived'. Requires authentication for 'draft'/'archived')
        *   `categoryId` (uuid, optional)
        *   `authorId` (uuid, optional)
        *   `search` (string, optional: searches in title and content)
        *   `sortBy` (string, default 'publishedAt')
        *   `sortOrder` (string, default 'DESC')
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": [
            {
              "id": "uuid",
              "title": "string",
              "slug": "string",
              "content": "string",
              "status": "string",
              "publishedAt": "date",
              "featuredImageId": "uuid",
              "authorId": "uuid",
              "categoryId": "uuid",
              "createdAt": "date",
              "updatedAt": "date",
              "author": { "id": "uuid", "username": "string", "email": "string" },
              "category": { "id": "uuid", "name": "string", "slug": "string" },
              "featuredImage": { "id": "uuid", "filename": "string", "filepath": "string" }
            }
          ],
          "meta": { "total": 100, "limit": 10, "offset": 0 }
        }
        ```

### 2. Get Post by ID or Slug

*   **`GET /posts/:identifier`**
    *   **Description:** Retrieves a single post by its ID or slug. Public users can only see `published` posts.
    *   **Authentication:** Optional (affects visibility of drafts)
    *   **`identifier` (path param):** Can be a UUID (post ID) or a slug string.
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": {
            "id": "uuid",
            "title": "string",
            "slug": "string",
            "content": "string",
            "status": "string",
            "publishedAt": "date",
            "featuredImageId": "uuid",
            "authorId": "uuid",
            "categoryId": "uuid",
            "createdAt": "date",
            "updatedAt": "date",
            "author": { "id": "uuid", "username": "string", "email": "string" },
            "category": { "id": "uuid", "name": "string", "slug": "string" },
            "featuredImage": { "id": "uuid", "filename": "string", "filepath": "string" }
          }
        }
        ```
    *   **Error Responses (403 Forbidden, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 403,
          "message": "Forbidden: You do not have permission to view this draft post."
        }
        ```

### 3. Create New Post

*   **`POST /posts`**
    *   **Description:** Creates a new post.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Request Body:**
        ```json
        {
          "title": "string (min 5, max 255)",
          "slug": "string (optional, will be auto-generated from title if not provided)",
          "content": "string",
          "status": "string (optional, 'draft'|'published'|'archived', default 'draft')",
          "categoryId": "uuid (optional, can be null)",
          "featuredImageId": "uuid (optional, can be null)"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
          "status": "success",
          "message": "Post created successfully",
          "data": { /* created post object */ }
        }
        ```
    *   **Error Responses (400 Bad Request):**
        ```json
        {
          "status": "error",
          "code": 400,
          "message": "Post with slug '...' already exists."
        }
        ```

### 4. Update Post by ID

*   **`PUT /posts/:id`**
    *   **Description:** Updates an existing post. Authors can update their own posts. Editors and Admins can update any post.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Request Body:** (any field from `createPost` is optional)
        ```json
        {
          "title": "string (optional)",
          "slug": "string (optional)",
          "content": "string (optional)",
          "status": "string (optional, 'draft'|'published'|'archived')",
          "categoryId": "uuid (optional, can be null)",
          "featuredImageId": "uuid (optional, can be null)"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Post updated successfully",
          "data": { /* updated post object */ }
        }
        ```
    *   **Error Responses (400 Bad Request, 403 Forbidden, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 403,
          "message": "Forbidden: You do not have permission to update this post."
        }
        ```

### 5. Delete Post by ID

*   **`DELETE /posts/:id`**
    *   **Description:** Deletes a post. Authors can delete their own posts. Editors and Admins can delete any post.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Post deleted successfully."
        }
        ```
    *   **Error Responses (403 Forbidden, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 403,
          "message": "Forbidden: You do not have permission to delete this post."
        }
        ```

---

## Category Management

### 1. Get All Categories

*   **`GET /categories`**
    *   **Description:** Retrieves a list of all categories. Publicly accessible.
    *   **Query Parameters:**
        *   `limit` (number, default 10)
        *   `offset` (number, default 0)
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": [
            { "id": "uuid", "name": "string", "slug": "string", "description": "string", "createdAt": "date", "updatedAt": "date" }
          ],
          "meta": { "total": 10, "limit": 10, "offset": 0 }
        }
        ```

### 2. Get Category by ID or Slug

*   **`GET /categories/:identifier`**
    *   **Description:** Retrieves a single category by its ID or slug. Publicly accessible.
    *   **`identifier` (path param):** Can be a UUID (category ID) or a slug string.
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": { "id": "uuid", "name": "string", "slug": "string", "description": "string", "createdAt": "date", "updatedAt": "date" }
        }
        ```
    *   **Error Responses (404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 404,
          "message": "Category not found."
        }
        ```

### 3. Create New Category

*   **`POST /categories`**
    *   **Description:** Creates a new category.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`
    *   **Request Body:**
        ```json
        {
          "name": "string (min 2, max 100)",
          "slug": "string (optional, will be auto-generated from name if not provided)",
          "description": "string (optional, can be null or empty string)"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
          "status": "success",
          "message": "Category created successfully",
          "data": { /* created category object */ }
        }
        ```
    *   **Error Responses (400 Bad Request):**
        ```json
        {
          "status": "error",
          "code": 400,
          "message": "Category with name '...' already exists."
        }
        ```

### 4. Update Category by ID

*   **`PUT /categories/:id`**
    *   **Description:** Updates an existing category.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`
    *   **Request Body:** (any field from `createCategory` is optional)
        ```json
        {
          "name": "string (optional)",
          "slug": "string (optional)",
          "description": "string (optional)"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Category updated successfully",
          "data": { /* updated category object */ }
        }
        ```
    *   **Error Responses (400 Bad Request, 404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 400,
          "message": "Category with slug '...' already exists."
        }
        ```

### 5. Delete Category by ID

*   **`DELETE /categories/:id`**
    *   **Description:** Deletes a category. Posts associated with this category will have their `categoryId` set to `NULL`.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Category deleted successfully."
        }
        ```
    *   **Error Responses (404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 404,
          "message": "Category not found."
        }
        ```

---

## Media Management

### 1. Upload Media File

*   **`POST /media/upload`**
    *   **Description:** Uploads a single media file.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Request Body:** `multipart/form-data` with a field named `media` containing the file.
        *   `media` (file): The file to upload.
    *   **File Type Restrictions:** JPEG, PNG, GIF, PDF, MP4.
    *   **File Size Limit:** 5MB (configurable).
    *   **Response (201 Created):**
        ```json
        {
          "status": "success",
          "message": "Media uploaded successfully",
          "data": {
            "id": "uuid",
            "filename": "string",
            "originalname": "string",
            "mimetype": "string",
            "size": "number",
            "filepath": "string (relative URL path)",
            "uploadedBy": "uuid",
            "createdAt": "date",
            "updatedAt": "date"
          }
        }
        ```
    *   **Error Responses (400 Bad Request):**
        ```json
        {
          "status": "error",
          "code": 400,
          "message": "Invalid file type. Only JPEG, PNG, GIF, PDF, MP4 are allowed."
        }
        ```

### 2. Get All Media Files

*   **`GET /media`**
    *   **Description:** Retrieves a list of all uploaded media files.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Query Parameters:**
        *   `limit` (number, default 10)
        *   `offset` (number, default 0)
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": [
            { "id": "uuid", "filename": "string", "originalname": "string", "mimetype": "string", "size": "number", "filepath": "string", "uploadedBy": "uuid", "createdAt": "date", "updatedAt": "date" }
          ],
          "meta": { "total": 10, "limit": 10, "offset": 0 }
        }
        ```

### 3. Get Media File by ID

*   **`GET /media/:id`**
    *   **Description:** Retrieves a single media file record by ID.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`, `author`
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "data": { "id": "uuid", "filename": "string", "originalname": "string", "mimetype": "string", "size": "number", "filepath": "string", "uploadedBy": "uuid", "createdAt": "date", "updatedAt": "date" }
        }
        ```
    *   **Error Responses (404 Not Found):**
        ```json
        {
          "status": "error",
          "code": 404,
          "message": "Media file not found."
        }
        ```

### 4. Delete Media File by ID

*   **`DELETE /media/:id`**
    *   **Description:** Deletes a media file record and the physical file from the server.
    *   **Authentication:** Required
    *   **Authorization:** `admin`, `editor`
    *   **Response (200 OK):**
        ```json
        {
          "status": "success",
          "message": "Media file deleted successfully."
        }
        ```
    *   **Error Responses (404 Not Found, 500 Internal Server Error):**
        ```json
        {
          "status": "error",
          "code": 500,
          "message": "Failed to delete physical file on server."
        }
        ```