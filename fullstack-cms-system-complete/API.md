```markdown
# ApexContent API Documentation (v1)

Base URL: `/api/v1`

All API endpoints expect and return JSON. Authentication is performed using Bearer Tokens (JWT) in the `Authorization` header for protected routes.

---

## 1. Authentication (`/auth`)

### `POST /api/v1/auth/register`

Register a new user account. Default role "user" is assigned.

*   **Request Body:** `application/json`
    ```json
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepassword123"
    }
    ```
*   **Response (201 Created):** `application/json`
    ```json
    {
        "access_token": "eyJhb...",
        "refresh_token": "eyJhb..."
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Missing fields or invalid JSON.
    *   `409 Conflict`: Username or email already exists.
    *   `500 Internal Server Error`: Server-side issues.

### `POST /api/v1/auth/login`

Authenticate a user and receive JWT tokens.

*   **Request Body:** `application/json`
    ```json
    {
        "username": "admin",
        "password": "adminpass"
    }
    ```
*   **Response (200 OK):** `application/json`
    ```json
    {
        "access_token": "eyJhb...",
        "refresh_token": "eyJhb..."
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Missing fields or invalid JSON.
    *   `401 Unauthorized`: Invalid credentials.
    *   `500 Internal Server Error`: Server-side issues.

### `POST /api/v1/auth/refresh`

Refresh an expired access token using a valid refresh token.

*   **Request Body:** `application/json`
    ```json
    {
        "refresh_token": "eyJhb..."
    }
    ```
*   **Response (200 OK):** `application/json`
    ```json
    {
        "access_token": "eyJhb...",
        "refresh_token": "eyJhb..."
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Missing refresh token or invalid JSON.
    *   `401 Unauthorized`: Invalid or expired refresh token.
    *   `500 Internal Server Error`: Server-side issues.

---

## 2. User Management (`/users`)

**Requires Authentication (`AuthFilter`)**
*   `admin` role required for most operations.
*   Users can access their own data (`GET /users/{id}`, `PUT /users/{id}`).

### `GET /api/v1/users`

Get a list of all users.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Response (200 OK):** `application/json`
    ```json
    [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@apexcontent.com",
            "first_name": "System",
            "last_name": "Admin",
            "is_active": true,
            "roles": ["admin"]
        },
        {
            "id": 2,
            "username": "editoruser",
            "email": "editor@apexcontent.com",
            "first_name": null,
            "last_name": null,
            "is_active": true,
            "roles": ["editor"]
        }
    ]
    ```
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions (not `admin`).
    *   `500 Internal Server Error`.

### `GET /api/v1/users/{id}`

Get details for a specific user.

*   **Authorization:** Bearer Token (requires `admin` role or `id` matches authenticated user's ID).
*   **Path Parameters:**
    *   `id` (integer): User ID.
*   **Response (200 OK):** `application/json` (same as individual user object from `/users`)
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: User with the given ID does not exist.
    *   `500 Internal Server Error`.

### `POST /api/v1/users`

Create a new user.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Request Body:** `application/json`
    ```json
    {
        "username": "new_editor",
        "email": "new_editor@example.com",
        "password": "strongpassword",
        "first_name": "John",
        "last_name": "Doe",
        "roleNames": ["editor", "author"]
    }
    ```
*   **Response (201 Created):** `application/json` (created user object, similar to GET response)
*   **Errors:**
    *   `400 Bad Request`: Missing fields, invalid JSON, or `roleNames` contains non-existent roles.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `409 Conflict`: Username or email already exists.
    *   `500 Internal Server Error`.

### `PUT /api/v1/users/{id}`

Update an existing user's details. Only `admin` can update roles or change `is_active` status. Other fields can be updated by `admin` or the user themselves.

*   **Authorization:** Bearer Token (requires `admin` role or `id` matches authenticated user's ID).
*   **Path Parameters:**
    *   `id` (integer): User ID.
*   **Request Body:** `application/json` (partial update is allowed)
    ```json
    {
        "email": "updated_editor@example.com",
        "first_name": "Jane",
        "roleNames": ["editor"] # Only admin can update this
    }
    ```
*   **Response (200 OK):** `application/json` (updated user object)
*   **Errors:**
    *   `400 Bad Request`: Invalid JSON, invalid roleNames.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions to update specific fields or user.
    *   `404 Not Found`: User with the given ID does not exist.
    *   `409 Conflict`: Attempted to update username/email to an already existing one.
    *   `500 Internal Server Error`.

### `DELETE /api/v1/users/{id}`

Delete a user.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Path Parameters:**
    *   `id` (integer): User ID.
*   **Response (204 No Content):** No body.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions (e.g., admin trying to delete self).
    *   `404 Not Found`: User with the given ID does not exist.
    *   `500 Internal Server Error`.

---

## 3. Content Types (`/content_types`)

**Requires Authentication (`AuthFilter`)**
*   `admin` role required for most operations. `editor` and `author` might have read access.

### `GET /api/v1/content_types`

Get a list of all defined content types.

*   **Authorization:** Bearer Token (requires `admin` or `editor` role, or `author` for read-only).
*   **Response (200 OK):** `application/json`
    ```json
    [
        {
            "id": 1,
            "name": "Blog Post",
            "slug": "blog-post",
            "description": "Schema for blog articles",
            "schema": { /* JSON Schema object */ },
            "created_by": 1,
            "created_at": "2023-10-27T10:00:00Z",
            "updated_at": "2023-10-27T10:00:00Z"
        }
    ]
    ```
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `500 Internal Server Error`.

### `GET /api/v1/content_types/{id}`

Get details for a specific content type.

*   **Authorization:** Bearer Token (requires `admin`, `editor`, or `author` role).
*   **Path Parameters:**
    *   `id` (integer): Content Type ID.
*   **Response (200 OK):** `application/json` (single content type object)
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: Content type with the given ID does not exist.
    *   `500 Internal Server Error`.

### `POST /api/v1/content_types`

Create a new content type.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Request Body:** `application/json`
    ```json
    {
        "name": "Product",
        "slug": "product",
        "description": "Schema for e-commerce products",
        "schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "price": {"type": "number"},
                "description": {"type": "string"}
            },
            "required": ["name", "price"]
        }
    }
    ```
*   **Response (201 Created):** `application/json` (created content type object)
*   **Errors:**
    *   `400 Bad Request`: Missing fields, invalid JSON, or invalid schema.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `409 Conflict`: Slug already exists.
    *   `500 Internal Server Error`.

### `PUT /api/v1/content_types/{id}`

Update an existing content type.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Path Parameters:**
    *   `id` (integer): Content Type ID.
*   **Request Body:** `application/json` (partial update allowed)
    ```json
    {
        "description": "Updated schema for e-commerce products",
        "schema": { /* new/updated JSON Schema object */ }
    }
    ```
*   **Response (200 OK):** `application/json` (updated content type object)
*   **Errors:**
    *   `400 Bad Request`: Invalid JSON, invalid schema.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: Content type with the given ID does not exist.
    *   `409 Conflict`: Attempted to update slug to an already existing one.
    *   `500 Internal Server Error`.

### `DELETE /api/v1/content_types/{id}`

Delete a content type. This will also delete all associated `content_items`.

*   **Authorization:** Bearer Token (requires `admin` role).
*   **Path Parameters:**
    *   `id` (integer): Content Type ID.
*   **Response (204 No Content):** No body.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: Content type with the given ID does not exist.
    *   `500 Internal Server Error`.

---

## 4. Content Items (`/content_items`)

**Requires Authentication (`AuthFilter`)**
*   Permissions (`admin`, `editor`, `author`) will determine what actions can be performed and what content can be seen.
*   `author` can create and manage their own content items (drafts).
*   `editor` can manage (create, edit, delete, publish) all content items.
*   `admin` has full control.
*   `user` role can only view `published` content items.

### `GET /api/v1/content_items`

Get a list of content items. Can be filtered by `content_type_id` and `status`.

*   **Authorization:** Bearer Token (all authenticated users).
*   **Query Parameters:**
    *   `content_type_id` (integer, optional): Filter by a specific content type.
    *   `status` (string, optional): Filter by content status (`draft`, `published`, `archived`). If not provided, `admin`/`editor`/`author` see all statuses for their access level. `user` roles only see `published` content.
*   **Response (200 OK):** `application/json`
    ```json
    [
        {
            "id": 101,
            "content_type_id": 1,
            "slug": "my-first-blog-post",
            "title": "My First Blog Post",
            "content": { /* JSON data conforming to content_type_id's schema */ },
            "status": "published",
            "version": 1,
            "published_at": "2023-10-27T12:30:00Z",
            "created_by": 2,
            "updated_by": 2,
            "created_at": "2023-10-27T11:00:00Z",
            "updated_at": "2023-10-27T12:30:00Z"
        }
    ]
    ```
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `500 Internal Server Error`.

### `GET /api/v1/content_items/{id}`

Get details for a specific content item.

*   **Authorization:** Bearer Token (all authenticated users. Access determined by content status and user role).
*   **Path Parameters:**
    *   `id` (integer): Content Item ID.
*   **Response (200 OK):** `application/json` (single content item object)
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions to view this specific item (e.g., `user` trying to view a `draft`).
    *   `404 Not Found`: Content item with the given ID does not exist.
    *   `500 Internal Server Error`.

### `POST /api/v1/content_items`

Create a new content item.

*   **Authorization:** Bearer Token (requires `admin`, `editor`, or `author` role).
*   **Request Body:** `application/json`
    ```json
    {
        "content_type_id": 1,
        "slug": "another-blog-post",
        "title": "Another Great Post",
        "content": {
            "summary": "This is a summary of another post.",
            "body": "More content here.",
            "tags": ["tech", "development"]
        },
        "status": "draft"
    }
    ```
*   **Response (201 Created):** `application/json` (created content item object)
*   **Errors:**
    *   `400 Bad Request`: Missing fields, invalid JSON, content does not conform to content type schema.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `409 Conflict`: Slug already exists for this content type.
    *   `404 Not Found`: `content_type_id` does not exist.
    *   `500 Internal Server Error`.

### `PUT /api/v1/content_items/{id}`

Update an existing content item. `author` can only update their own drafts. `editor`/`admin` can update anything and change status to `published`.

*   **Authorization:** Bearer Token (requires `admin`, `editor`, or `author` role).
*   **Path Parameters:**
    *   `id` (integer): Content Item ID.
*   **Request Body:** `application/json` (partial update allowed)
    ```json
    {
        "title": "Updated Title",
        "content": { /* updated JSON data */ },
        "status": "published" # Requires editor/admin role
    }
    ```
*   **Response (200 OK):** `application/json` (updated content item object)
*   **Errors:**
    *   `400 Bad Request`: Invalid JSON, content does not conform to content type schema.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions (e.g., author updating others' content, author publishing).
    *   `404 Not Found`: Content item with the given ID does not exist.
    *   `409 Conflict`: Attempted to update slug to an already existing one.
    *   `500 Internal Server Error`.

### `DELETE /api/v1/content_items/{id}`

Delete a content item. `author` can only delete their own drafts. `editor`/`admin` can delete any content item.

*   **Authorization:** Bearer Token (requires `admin` or `editor` role, or `author` for own drafts).
*   **Path Parameters:**
    *   `id` (integer): Content Item ID.
*   **Response (204 No Content):** No body.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: Content item with the given ID does not exist.
    *   `500 Internal Server Error`.

---

## 5. Media Assets (`/media_assets`)

**Requires Authentication (`AuthFilter`)**
*   `author`, `editor`, `admin` can upload.
*   `admin`, `editor` can manage all assets. `author` can manage their own.
*   All authenticated users can retrieve.

### `GET /api/v1/media_assets`

Get a list of all media assets (metadata).

*   **Authorization:** Bearer Token (all authenticated users).
*   **Response (200 OK):** `application/json`
    ```json
    [
        {
            "id": 1,
            "filename": "image.jpg",
            "filepath": "/uploads/2023/10/image.jpg",
            "mimetype": "image/jpeg",
            "filesize_bytes": 102400,
            "description": "Hero image for homepage",
            "uploaded_by": 1,
            "created_at": "2023-10-27T13:00:00Z"
        }
    ]
    ```
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `500 Internal Server Error`.

### `GET /api/v1/media_assets/{id}`

Get metadata for a specific media asset.

*   **Authorization:** Bearer Token (all authenticated users).
*   **Path Parameters:**
    *   `id` (integer): Media Asset ID.
*   **Response (200 OK):** `application/json` (single media asset object)
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: Media asset with the given ID does not exist.
    *   `500 Internal Server Error`.

### `POST /api/v1/media_assets`

Upload a new media asset.

*   **Authorization:** Bearer Token (requires `admin`, `editor`, or `author` role).
*   **Request Body:** `multipart/form-data`
    *   `file` (file): The actual file to upload.
    *   `description` (string, optional): A description for the file.
*   **Response (201 Created):** `application/json` (created media asset object)
*   **Errors:**
    *   `400 Bad Request`: Missing file, invalid file type/size.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `500 Internal Server Error`: File system errors, etc.

### `DELETE /api/v1/media_assets/{id}`

Delete a media asset.

*   **Authorization:** Bearer Token (requires `admin` or `editor` role, or `author` for own assets).
*   **Path Parameters:**
    *   `id` (integer): Media Asset ID.
*   **Response (204 No Content):** No body.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: Insufficient permissions.
    *   `404 Not Found`: Media asset with the given ID does not exist.
    *   `500 Internal Server Error`.

---
```