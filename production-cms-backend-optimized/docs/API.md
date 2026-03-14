```markdown
# API Documentation

This document describes the RESTful API endpoints for the CMS backend.

**Base URL:** `/api`

**Authentication:**
Most endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a `Bearer` token.
`Authorization: Bearer <your_jwt_token>`

**Error Responses:**
Errors are returned as JSON objects with a `success: false` field, a `message`, and optionally `error` details in `development` environment.

```json
{
  "success": false,
  "message": "Error description",
  "error": "Stack trace (in dev mode)"
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Registers a new user.

*   **Permissions:** Public
*   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string (email format)",
      "password": "string (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)"
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "User registered successfully",
          "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "role": "string (e.g., Author)"
          },
          "token": "jwt_token_string"
        }
        ```
    *   `400 Bad Request`: Invalid input or user already exists.

### `POST /api/auth/login`
Logs in an existing user.

*   **Permissions:** Public
*   **Request Body:**
    ```json
    {
      "email": "string (email format)",
      "password": "string"
    }
    ```
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "message": "Logged in successfully",
          "user": {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "role": "string (e.g., Admin)"
          },
          "token": "jwt_token_string"
        }
        ```
    *   `401 Unauthorized`: Invalid credentials.

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user.

*   **Permissions:** Authenticated User
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "id": "uuid",
          "username": "string",
          "email": "string",
          "role": "string",
          "createdAt": "ISO date string",
          "updatedAt": "ISO date string"
        }
        ```
    *   `401 Unauthorized`: No token or invalid token.
    *   `404 Not Found`: User associated with token not found.

### `POST /api/auth/logout`
Logs out the current user (primarily client-side token invalidation, but can be extended for server-side blacklist/session management).

*   **Permissions:** Authenticated User
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "message": "Logged out successfully"
        }
        ```
    *   `401 Unauthorized`: No token or invalid token.

---

## 2. Users (`/api/users`)

*Permissions for these routes typically require `manage_users` or `read_users` depending on the operation.*

### `GET /api/users`
Retrieve a list of all users.

*   **Permissions:** `read_users`
*   **Query Parameters:** `limit`, `offset`, `search`
*   **Responses:**
    *   `200 OK`: Array of user objects (excluding password).

### `GET /api/users/:id`
Retrieve a single user by ID.

*   **Permissions:** `read_users`
*   **Responses:**
    *   `200 OK`: User object.
    *   `404 Not Found`: User not found.

### `POST /api/users`
Create a new user (by an admin).

*   **Permissions:** `manage_users`
*   **Request Body:** Similar to register, with optional `roleId`.
*   **Responses:** `201 Created`, `400 Bad Request`

### `PUT /api/users/:id`
Update a user's details.

*   **Permissions:** `manage_users`
*   **Request Body:** `username`, `email`, `roleId` (optional, for partial updates).
*   **Responses:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `DELETE /api/users/:id`
Delete a user.

*   **Permissions:** `manage_users`
*   **Responses:** `204 No Content`, `404 Not Found`

---

## 3. Content Types (`/api/content-types`)

*Permissions for these routes typically require `manage_content_types`.*

### `GET /api/content-types`
Retrieve all defined content types.

*   **Permissions:** `read_content_items` (or more specific, like `read_content_types`)
*   **Responses:** `200 OK`: Array of content type objects.

### `GET /api/content-types/:id`
Retrieve a single content type by ID.

*   **Permissions:** `read_content_types`
*   **Responses:** `200 OK`, `404 Not Found`

### `POST /api/content-types`
Create a new content type.

*   **Permissions:** `manage_content_types`
*   **Request Body:**
    ```json
    {
      "name": "string",
      "description": "string (optional)",
      "fields": [
        { "name": "string", "label": "string", "type": "string|text|number|boolean|date|json|media|relation", "required": "boolean" }
      ],
      "isPublishable": "boolean (optional, default true)"
    }
    ```
*   **Responses:** `201 Created`, `400 Bad Request`

### `PUT /api/content-types/:id`
Update an existing content type.

*   **Permissions:** `manage_content_types`
*   **Request Body:** Partial content type object.
*   **Responses:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `DELETE /api/content-types/:id`
Delete a content type (will also delete all associated content items).

*   **Permissions:** `manage_content_types`
*   **Responses:** `204 No Content`, `404 Not Found`

---

## 4. Content Items (`/api/content-items`)

*Permissions for these routes vary: `read_content_items`, `create_content_items`, `update_content_items`, `delete_content_items`, `publish_content_items` or `edit_own_content_items`, `delete_own_content_items`.*

### `GET /api/content-items`
Retrieve all content items.

*   **Permissions:** `read_content_items`
*   **Query Parameters:**
    *   `contentTypeId`: Filter by content type (UUID).
    *   `status`: Filter by status (`draft`, `published`, etc.).
    *   `limit`, `offset`: For pagination.
*   **Responses:** `200 OK`: Paginated array of content item objects.

### `GET /api/content-items/:id`
Retrieve a single content item by ID.

*   **Permissions:** `read_content_items`
*   **Responses:** `200 OK`, `404 Not Found`

### `POST /api/content-items`
Create a new content item.

*   **Permissions:** `create_content_items`
*   **Request Body:**
    ```json
    {
      "contentTypeId": "uuid",
      "data": { "field1": "value1", "field2": "value2" }, // Structure defined by ContentType.fields
      "status": "string (optional, default 'draft', e.g., 'draft', 'published')"
    }
    ```
*   **Responses:** `201 Created`, `400 Bad Request` (e.g., validation against content type schema fails)

### `PUT /api/content-items/:id`
Update an existing content item.

*   **Permissions:** `update_content_items` (or `edit_own_content_items` if author)
*   **Request Body:** Partial content item data (`data`, `status`).
*   **Responses:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `DELETE /api/content-items/:id`
Delete a content item.

*   **Permissions:** `delete_content_items` (or `delete_own_content_items` if author)
*   **Responses:** `204 No Content`, `404 Not Found`

---

## 5. Media (`/api/media`)

*Permissions for these routes typically require `read_media`, `upload_media`, or `manage_media`.*

### `GET /api/media`
Retrieve all uploaded media files.

*   **Permissions:** `read_media`
*   **Query Parameters:** `limit`, `offset`, `search` (by filename, altText).
*   **Responses:** `200 OK`: Array of media objects.

### `GET /api/media/:id`
Retrieve a single media file by ID.

*   **Permissions:** `read_media`
*   **Responses:** `200 OK`, `404 Not Found`

### `POST /api/media/upload`
Upload a new media file.

*   **Permissions:** `upload_media`
*   **Request Body:** `multipart/form-data` with a field named `file`.
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "message": "File uploaded successfully",
          "media": {
            "id": "uuid",
            "filename": "string",
            "url": "string (public URL)",
            "altText": "string (optional)",
            "description": "string (optional)",
            "uploadedBy": "uuid"
          }
        }
        ```
    *   `400 Bad Request`: Invalid file type, size limit exceeded.

### `PUT /api/media/:id`
Update media metadata (e.g., `altText`, `description`).

*   **Permissions:** `manage_media`
*   **Request Body:** `altText`, `description` (optional, for partial updates).
*   **Responses:** `200 OK`, `400 Bad Request`, `404 Not Found`

### `DELETE /api/media/:id`
Delete a media file.

*   **Permissions:** `manage_media`
*   **Responses:** `204 No Content`, `404 Not Found`

---
```