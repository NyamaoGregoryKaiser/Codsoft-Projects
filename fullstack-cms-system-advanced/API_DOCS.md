# API Documentation: Enterprise-Grade CMS Backend

This document provides detailed information about the RESTful API endpoints exposed by the CMS backend. All API endpoints are prefixed with `/api`.

## Base URL

`http://localhost:5000/api` (during local development)

## Authentication

Authentication is primarily handled via JSON Web Tokens (JWT).
1.  **Login:** Send `POST /api/auth/login` with email and password to receive an `accessToken` and `refreshToken`.
2.  **Access Protected Routes:** Include the `accessToken` in the `Authorization` header of subsequent requests:
    `Authorization: Bearer <accessToken>`
3.  **Refresh Token:** Use `POST /api/auth/refresh-token` with the `refreshToken` to obtain a new `accessToken` when the current one expires.

## Error Handling

The API returns standardized JSON error responses with appropriate HTTP status codes:

```json
{
  "status": "fail",  // or "error" for server-side issues
  "message": "Error description (e.g., 'Validation failed: ...' or 'Unauthorized')",
  "stack": "..."     // (only in development environment)
}
```

## Rate Limiting

*   All API endpoints are subject to a global rate limit of 100 requests per 15 minutes per IP.
*   The `POST /api/auth/login` endpoint has a stricter rate limit of 5 requests per 15 minutes per IP to prevent brute-force attacks.

## Endpoints

---

### 1. Authentication (`/api/auth`)

#### `POST /api/auth/login`
*   **Description:** Authenticates a user and returns an access token and refresh token.
*   **Rate Limit:** 5 requests per 15 minutes per IP.
*   **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "accessToken": "string (JWT)",
      "refreshToken": "string (JWT)",
      "user": {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": {
          "id": "uuid",
          "name": "string",
          "description": "string"
        },
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    }
    ```
*   **Error Responses:** 400 Bad Request (Validation), 401 Unauthorized (Invalid credentials), 429 Too Many Requests.

#### `POST /api/auth/refresh-token`
*   **Description:** Renews an expired access token using a refresh token.
*   **Request Body:**
    ```json
    {
      "refreshToken": "string (JWT)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "accessToken": "string (new JWT)"
    }
    ```
*   **Error Responses:** 401 Unauthorized (Invalid or expired refresh token).

#### `GET /api/auth/me`
*   **Description:** Returns details of the currently authenticated user.
*   **Authentication:** Required (Bearer Token).
*   **Response (200 OK):** (Same as `user` object in login response)
    ```json
    {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": { ... },
        "createdAt": "datetime",
        "updatedAt": "datetime"
    }
    ```
*   **Error Responses:** 401 Unauthorized.

---

### 2. Users (`/api/users`)

*   **Authentication:** Required (Bearer Token).
*   **Authorization:** Most endpoints require `admin` role. `editor` can view.

#### `GET /api/users`
*   **Description:** Retrieve a list of all users.
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `User[]`

#### `GET /api/users/:id`
*   **Description:** Retrieve a single user by ID.
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `User` object (excluding password).
*   **Error Responses:** 404 Not Found.

#### `POST /api/users`
*   **Description:** Create a new user.
*   **Authorization:** `admin`.
*   **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string (min 8 chars)",
      "firstName": "string",
      "lastName": "string",
      "roleName": "string (e.g., 'editor', 'admin', 'viewer')"
    }
    ```
*   **Response (201 Created):** `User` object (excluding password).
*   **Error Responses:** 400 Bad Request (Validation, Role not found), 409 Conflict (Email already exists).

#### `PUT /api/users/:id`
*   **Description:** Update an existing user.
*   **Authorization:** `admin`.
*   **Request Body:** (Partial `CreateUserDto`)
    ```json
    {
      "email": "string (optional)",
      "password": "string (optional, min 8 chars)",
      "firstName": "string (optional)",
      "lastName": "string (optional)",
      "roleName": "string (optional)"
    }
    ```
*   **Response (200 OK):** Updated `User` object (excluding password).
*   **Error Responses:** 400 Bad Request (Validation, Role not found), 404 Not Found, 409 Conflict (Email already exists).

#### `DELETE /api/users/:id`
*   **Description:** Delete a user.
*   **Authorization:** `admin`.
*   **Response (204 No Content).**
*   **Error Responses:** 404 Not Found.

---

### 3. Roles (`/api/roles`)

*   **Authentication:** Required (Bearer Token).
*   **Authorization:** `admin` for CRUD, `editor` can view.

#### `GET /api/roles`
*   **Description:** Retrieve a list of all roles.
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `Role[]`

#### `GET /api/roles/:id`
*   **Description:** Retrieve a single role by ID.
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `Role` object.
*   **Error Responses:** 404 Not Found.

#### `POST /api/roles`
*   **Description:** Create a new role.
*   **Authorization:** `admin`.
*   **Request Body:**
    ```json
    {
      "name": "string (min 3, max 50)",
      "description": "string (optional, max 255)"
    }
    ```
*   **Response (201 Created):** `Role` object.
*   **Error Responses:** 400 Bad Request (Validation), 409 Conflict (Name already exists).

#### `PUT /api/roles/:id`
*   **Description:** Update an existing role.
*   **Authorization:** `admin`.
*   **Request Body:** (Partial `CreateRoleDto`)
    ```json
    {
      "name": "string (optional, min 3, max 50)",
      "description": "string (optional, max 255)"
    }
    ```
*   **Response (200 OK):** Updated `Role` object.
*   **Error Responses:** 400 Bad Request (Validation), 404 Not Found, 409 Conflict (Name already exists).

#### `DELETE /api/roles/:id`
*   **Description:** Delete a role.
*   **Authorization:** `admin`.
*   **Response (204 No Content).**
*   **Error Responses:** 404 Not Found, 409 Conflict (If role is assigned to users, onDelete:'RESTRICT').

---

### 4. Categories (`/api/categories`)

*   **Authentication:** Required for POST, PUT, DELETE. Read access is public.
*   **Authorization:** `admin`, `editor` for modifying categories. `admin` for deletion.

#### `GET /api/categories`
*   **Description:** Retrieve a list of all categories.
*   **Authentication:** Not required (Public). Cached for 1 hour.
*   **Response (200 OK):** `Category[]`

#### `GET /api/categories/:id`
*   **Description:** Retrieve a single category by ID.
*   **Authentication:** Not required (Public).
*   **Response (200 OK):** `Category` object.
*   **Error Responses:** 404 Not Found.

#### `POST /api/categories`
*   **Description:** Create a new category.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:**
    ```json
    {
      "name": "string (min 3, max 100)",
      "slug": "string (optional, URL-friendly, min 3, max 100)",
      "description": "string (optional, max 255)"
    }
    ```
*   **Response (201 Created):** `Category` object.
*   **Error Responses:** 400 Bad Request (Validation), 409 Conflict (Name or slug already exists).

#### `PUT /api/categories/:id`
*   **Description:** Update an existing category.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:** (Partial `CreateCategoryDto`)
    ```json
    {
      "name": "string (optional)",
      "slug": "string (optional)",
      "description": "string (optional)"
    }
    ```
*   **Response (200 OK):** Updated `Category` object.
*   **Error Responses:** 400 Bad Request (Validation), 404 Not Found, 409 Conflict.

#### `DELETE /api/categories/:id`
*   **Description:** Delete a category.
*   **Authorization:** `admin`.
*   **Response (204 No Content).**
*   **Error Responses:** 404 Not Found.

---

### 5. Tags (`/api/tags`)

*   **Authentication:** Required for POST, PUT, DELETE. Read access is public.
*   **Authorization:** `admin`, `editor` for modifying tags. `admin` for deletion.

#### `GET /api/tags`
*   **Description:** Retrieve a list of all tags.
*   **Authentication:** Not required (Public). Cached for 1 hour.
*   **Response (200 OK):** `Tag[]`

#### `GET /api/tags/:id`
*   **Description:** Retrieve a single tag by ID.
*   **Authentication:** Not required (Public).
*   **Response (200 OK):** `Tag` object.
*   **Error Responses:** 404 Not Found.

#### `POST /api/tags`
*   **Description:** Create a new tag.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:**
    ```json
    {
      "name": "string (min 2, max 50)",
      "slug": "string (optional, URL-friendly, min 2, max 50)"
    }
    ```
*   **Response (201 Created):** `Tag` object.
*   **Error Responses:** 400 Bad Request (Validation), 409 Conflict (Name or slug already exists).

#### `PUT /api/tags/:id`
*   **Description:** Update an existing tag.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:** (Partial `CreateTagDto`)
    ```json
    {
      "name": "string (optional)",
      "slug": "string (optional)"
    }
    ```
*   **Response (200 OK):** Updated `Tag` object.
*   **Error Responses:** 400 Bad Request (Validation), 404 Not Found, 409 Conflict.

#### `DELETE /api/tags/:id`
*   **Description:** Delete a tag.
*   **Authorization:** `admin`.
*   **Response (204 No Content).**
*   **Error Responses:** 404 Not Found.

---

### 6. Content (`/api/content`)

*   **Authentication:** Required for POST, PUT, DELETE. Read access is public for PUBLISHED content.
*   **Authorization:** `admin`, `editor` for creating/updating content. `admin` for deletion. `admin`/`editor` can view ALL content (including drafts).

#### `GET /api/content`
*   **Description:** Retrieve a list of all **published** content.
*   **Authentication:** Not required (Public). Cached for 1 minute.
*   **Response (200 OK):** `Content[]`

#### `GET /api/content/:idOrSlug`
*   **Description:** Retrieve a single **published** content item by ID or slug.
*   **Authentication:** Not required (Public).
*   **Response (200 OK):** `Content` object.
*   **Error Responses:** 404 Not Found.

#### `GET /api/content/admin/all`
*   **Description:** Retrieve a list of all content items, including `draft` and `archived` statuses.
*   **Authentication:** Required (Bearer Token).
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `Content[]`

#### `GET /api/content/admin/:idOrSlug`
*   **Description:** Retrieve a single content item (including `draft` and `archived` statuses) by ID or slug.
*   **Authentication:** Required (Bearer Token).
*   **Authorization:** `admin`, `editor`.
*   **Response (200 OK):** `Content` object.
*   **Error Responses:** 404 Not Found.

#### `POST /api/content`
*   **Description:** Create a new content item. Author is automatically set to the authenticated user.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:**
    ```json
    {
      "title": "string (min 5, max 255)",
      "slug": "string (optional, URL-friendly, min 5, max 255)",
      "body": "string (long text)",
      "status": "enum (optional, 'draft' | 'published' | 'archived', default 'draft')",
      "categoryId": "uuid (optional)",
      "tagIds": ["uuid", "uuid"] (optional array of tag UUIDs)
    }
    ```
*   **Response (201 Created):** `Content` object.
*   **Error Responses:** 400 Bad Request (Validation, Category/Tags not found), 401 Unauthorized, 409 Conflict (Slug already exists).

#### `PUT /api/content/:id`
*   **Description:** Update an existing content item.
*   **Authorization:** `admin`, `editor`.
*   **Request Body:** (Partial `CreateContentDto`)
    ```json
    {
      "title": "string (optional)",
      "slug": "string (optional)",
      "body": "string (optional)",
      "status": "enum (optional)",
      "categoryId": "uuid | null (optional, use null to remove category)",
      "tagIds": ["uuid", "uuid"] (optional array of tag UUIDs, use [] to remove all tags)
    }
    ```
*   **Response (200 OK):** Updated `Content` object.
*   **Error Responses:** 400 Bad Request (Validation, Category/Tags not found), 404 Not Found, 409 Conflict.

#### `DELETE /api/content/:id`
*   **Description:** Delete a content item.
*   **Authorization:** `admin`.
*   **Response (204 No Content).**
*   **Error Responses:** 404 Not Found.

---
```

#### **5.4 `DEPLOYMENT.md`**

```markdown