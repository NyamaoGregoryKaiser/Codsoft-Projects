```markdown
# NimbusCMS API Documentation

This document outlines the RESTful API endpoints for NimbusCMS, including authentication, resource management, and expected request/response formats.

**Base URL:** `http://localhost:5000/v1` (or your deployed backend URL)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header: `Bearer <access_token>`.

### 1. Register User
*   **Endpoint:** `POST /auth/register`
*   **Description:** Creates a new user account.
*   **Permissions:** Public
*   **Request Body:**
    ```json
    {
      "username": "john.doe",
      "email": "john.doe@example.com",
      "password": "StrongPassword123",
      "role": "editor" // Optional: 'admin', 'editor', 'viewer'. Defaults to 'viewer'.
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "user": {
        "id": "uuid-of-user",
        "username": "john.doe",
        "email": "john.doe@example.com",
        "role": "editor",
        "createdAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
        "updatedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
      },
      "tokens": {
        "access": {
          "token": "jwt-access-token",
          "expires": "YYYY-MM-DDTHH:mm:ss.sssZ"
        },
        "refresh": {
          "token": "jwt-refresh-token",
          "expires": "YYYY-MM-DDTHH:mm:ss.sssZ"
        }
      }
    }
    ```
*   **Error (400 Bad Request):** If email/username taken or validation fails.

### 2. Login User
*   **Endpoint:** `POST /auth/login`
*   **Description:** Authenticates a user and returns access and refresh tokens.
*   **Permissions:** Public (Rate-limited)
*   **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "StrongPassword123"
    }
    ```
*   **Response (200 OK):** Same as Register response.
*   **Error (401 Unauthorized):** If credentials are incorrect.

### 3. Refresh Tokens
*   **Endpoint:** `POST /auth/refresh-tokens`
*   **Description:** Generates new access and refresh tokens using a valid refresh token.
*   **Permissions:** Public (Rate-limited)
*   **Request Body:**
    ```json
    {
      "refreshToken": "jwt-refresh-token"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": {
        "token": "new-jwt-access-token",
        "expires": "YYYY-MM-DDTHH:mm:ss.sssZ"
      },
      "refresh": {
        "token": "new-jwt-refresh-token",
        "expires": "YYYY-MM-DDTHH:mm:ss.sssZ"
      }
    }
    ```
*   **Error (401 Unauthorized):** If refresh token is invalid or expired.

### 4. Logout User
*   **Endpoint:** `POST /auth/logout`
*   **Description:** (Client-side token discard for this implementation). If server-side refresh token management were in place, it would invalidate the refresh token.
*   **Permissions:** Any authenticated user
*   **Response (204 No Content):**
    ```
    (No content)
    ```

## User Management

### 1. Create User
*   **Endpoint:** `POST /users`
*   **Description:** Creates a new user.
*   **Permissions:** `admin`
*   **Request Body:** Same as Register, but `password` is required.
*   **Response (201 Created):**
    ```json
    {
      "id": "uuid-of-user",
      "username": "newuser",
      "email": "newuser@example.com",
      "role": "viewer",
      "createdAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "updatedAt": "YYYY-MM-DDTHH:mm:ss.sssZ"
    }
    ```

### 2. Get All Users
*   **Endpoint:** `GET /users`
*   **Description:** Retrieves a list of all users with pagination and filtering.
*   **Permissions:** `admin`
*   **Query Parameters:**
    *   `username` (string): Filter by username.
    *   `role` (string): Filter by role (`admin`, `editor`, `viewer`).
    *   `sortBy` (string): Sort format `field:direction` (e.g., `createdAt:desc`, `username:asc`).
    *   `limit` (number): Number of results per page (default: 10).
    *   `page` (number): Page number (default: 1).
*   **Response (200 OK):**
    ```json
    {
      "results": [
        { /* user object */ },
        { /* user object */ }
      ],
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalResults": 42
    }
    ```

### 3. Get User by ID
*   **Endpoint:** `GET /users/:userId`
*   **Description:** Retrieves a single user by their ID.
*   **Permissions:** `admin`
*   **Response (200 OK):** User object.

### 4. Update User by ID
*   **Endpoint:** `PATCH /users/:userId`
*   **Description:** Updates a user's information.
*   **Permissions:** `admin`
*   **Request Body:** Partial user object (e.g., `{"role": "admin"}`). `password` can be updated.
*   **Response (200 OK):** Updated user object.

### 5. Delete User by ID
*   **Endpoint:** `DELETE /users/:userId`
*   **Description:** Deletes a user.
*   **Permissions:** `admin`
*   **Response (204 No Content):**

## Content Types

### 1. Create Content Type
*   **Endpoint:** `POST /content-types`
*   **Description:** Defines a new content type with its fields.
*   **Permissions:** `admin`
*   **Request Body:**
    ```json
    {
      "name": "Blog Post",
      "slug": "blog-post",
      "description": "A type for blog articles",
      "fields": [
        { "name": "title", "label": "Post Title", "type": "text", "required": true, "unique": true },
        { "name": "slug", "label": "URL Slug", "type": "text", "required": true, "unique": true },
        { "name": "content", "label": "Content Body", "type": "richtext", "required": true },
        { "name": "author", "label": "Author", "type": "relation", "targetContentType": "user", "required": true },
        { "name": "thumbnail", "label": "Thumbnail Image", "type": "media" },
        { "name": "publishedDate", "label": "Publish Date", "type": "date" },
        { "name": "isFeatured", "label": "Featured Post", "type": "boolean" },
        { "name": "views", "label": "Number of Views", "type": "number", "defaultValue": 0 }
      ]
    }
    ```
    *   `type`: `text`, `richtext`, `number`, `boolean`, `date`, `media` (expects URL), `relation` (expects UUID of related entry/user).
    *   `targetContentType`: Required for `relation` type, specifies the related content type (e.g., 'user', or another ContentType's UUID).
*   **Response (201 Created):** Created content type object.

### 2. Get All Content Types
*   **Endpoint:** `GET /content-types`
*   **Description:** Retrieves a list of all content types.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Query Parameters:** `name`, `slug`, `sortBy`, `limit`, `page`.
*   **Response (200 OK):** Paginated list of content type objects.

### 3. Get Content Type by ID
*   **Endpoint:** `GET /content-types/:contentTypeId`
*   **Description:** Retrieves a single content type by its ID.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Response (200 OK):** Content type object.

### 4. Update Content Type by ID
*   **Endpoint:** `PATCH /content-types/:contentTypeId`
*   **Description:** Updates a content type's definition. **Note:** Updating `fields` is restricted if entries already exist for the content type.
*   **Permissions:** `admin`
*   **Request Body:** Partial content type object.
*   **Response (200 OK):** Updated content type object.

### 5. Delete Content Type by ID
*   **Endpoint:** `DELETE /content-types/:contentTypeId`
*   **Description:** Deletes a content type. **Note:** Cannot delete if entries exist for this content type.
*   **Permissions:** `admin`
*   **Response (204 No Content):**

## Content Entries

### 1. Create Entry
*   **Endpoint:** `POST /content-types/:contentTypeId/entries`
*   **Description:** Creates a new content entry for a specific content type.
*   **Permissions:** `admin`, `editor`
*   **Request Body:**
    ```json
    {
      "status": "draft", // "draft", "published", "archived"
      "data": {
        "title": "My First Blog Post",
        "slug": "my-first-blog-post",
        "content": "<p>Hello world!</p>",
        "author": "uuid-of-user-who-authored",
        "publishedDate": "2023-10-27"
      }
    }
    ```
    *   `data` object structure must conform to the `fields` defined in the `contentTypeId`.
*   **Response (201 Created):** Created entry object.

### 2. Get All Entries for a Content Type
*   **Endpoint:** `GET /content-types/:contentTypeId/entries`
*   **Description:** Retrieves a list of entries for a specific content type.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Query Parameters:** `status` (`draft`, `published`, `archived`), `sortBy`, `limit`, `page`.
*   **Response (200 OK):** Paginated list of entry objects.

### 3. Get Entry by ID
*   **Endpoint:** `GET /content-types/:contentTypeId/entries/:entryId`
*   **Description:** Retrieves a single entry by its ID within a content type.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Response (200 OK):** Entry object.

### 4. Update Entry by ID
*   **Endpoint:** `PATCH /content-types/:contentTypeId/entries/:entryId`
*   **Description:** Updates an existing content entry.
*   **Permissions:** `admin`, `editor`
*   **Request Body:** Partial entry object (e.g., `{"status": "published", "data": {"title": "Updated Title"}}`).
*   **Response (200 OK):** Updated entry object.

### 5. Delete Entry by ID
*   **Endpoint:** `DELETE /content-types/:contentTypeId/entries/:entryId`
*   **Description:** Deletes a content entry.
*   **Permissions:** `admin`, `editor`
*   **Response (204 No Content):**

## Media Library

### 1. Create Media Item (Simplified)
*   **Endpoint:** `POST /media`
*   **Description:** Creates a record for a media item. **Note:** In this demo, actual file upload is simulated by providing `filename`, `path`, `mimeType`, and `size` in the request body. A real-world scenario would involve `multer` and cloud storage (e.g., S3).
*   **Permissions:** `admin`, `editor`
*   **Request Body:**
    ```json
    {
      "name": "My Awesome Image",
      "filename": "my-awesome-image.jpg",
      "path": "https://example.com/uploads/my-awesome-image.jpg",
      "mimeType": "image/jpeg",
      "size": 102400
    }
    ```
*   **Response (201 Created):** Created media object.

### 2. Get All Media Items
*   **Endpoint:** `GET /media`
*   **Description:** Retrieves a list of all media items.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Query Parameters:** `name`, `mimeType`, `sortBy`, `limit`, `page`.
*   **Response (200 OK):** Paginated list of media objects.

### 3. Get Media Item by ID
*   **Endpoint:** `GET /media/:mediaId`
*   **Description:** Retrieves a single media item by its ID.
*   **Permissions:** `admin`, `editor`, `viewer` (Cached)
*   **Response (200 OK):** Media object.

### 4. Update Media Item by ID
*   **Endpoint:** `PATCH /media/:mediaId`
*   **Description:** Updates a media item's metadata.
*   **Permissions:** `admin`, `editor`
*   **Request Body:** Partial media object (e.g., `{"name": "New Name"}`).
*   **Response (200 OK):** Updated media object.

### 5. Delete Media Item by ID
*   **Endpoint:** `DELETE /media/:mediaId`
*   **Description:** Deletes a media item record. (Does not delete actual file from storage in this demo).
*   **Permissions:** `admin`, `editor`
*   **Response (204 No Content):**
```