# CMS Project: API Documentation

This document provides an overview of the RESTful API for the CMS Project. The API follows a standard REST design, providing endpoints for CRUD operations on users, content, and media.

**For complete, interactive API documentation, please visit the Swagger UI:**

👉 **[http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)** 👈
*(Ensure your backend Docker container is running)*

The Swagger UI provides:
*   An interactive interface to explore all available endpoints.
*   Detailed information about request methods, parameters, and response structures.
*   Ability to try out API calls directly from the browser.
*   Authentication via JWT (using the "Authorize" button).

## Base URL

The base URL for all API endpoints is: `http://localhost:8000/api/v1/`

*(In a production environment, this would be your deployed domain, e.g., `https://api.yourdomain.com/api/v1/`)*

## Authentication

The API uses **JSON Web Tokens (JWT)** for authentication.

### Workflow:

1.  **Register**: Create a new user account.
    *   `POST /api/v1/auth/register/`
    *   **Request Body**:
        ```json
        {
          "username": "newuser",
          "email": "newuser@example.com",
          "password": "strongpassword123",
          "password2": "strongpassword123",
          "first_name": "New",
          "last_name": "User"
        }
        ```
    *   **Success Response**: `HTTP 201 Created` with `{"message": "User registered successfully."}`

2.  **Login**: Obtain JWT tokens.
    *   `POST /api/v1/auth/token/`
    *   **Request Body**:
        ```json
        {
          "username": "your_username",
          "password": "your_password"
        }
        ```
    *   **Success Response**: `HTTP 200 OK`
        ```json
        {
          "refresh": "eyJ...your_refresh_token...Q",
          "access": "eyJ...your_access_token...o",
          "user": {
            "id": 1,
            "username": "your_username",
            "email": "your_email@example.com",
            "is_staff": false,
            // ... other user details
          }
        }
        ```
    *   **On subsequent requests**: Include the `access` token in the `Authorization` header:
        `Authorization: Bearer <your_access_token>`

3.  **Refresh Token**: Obtain a new `access` token when the current one expires, using the `refresh` token.
    *   `POST /api/v1/auth/token/refresh/`
    *   **Request Body**:
        ```json
        {
          "refresh": "eyJ...your_refresh_token...Q"
        }
        ```
    *   **Success Response**: `HTTP 200 OK` with new `access` and `refresh` tokens.

4.  **Verify Token**: Check if an `access` token is valid.
    *   `POST /api/v1/auth/token/verify/`
    *   **Request Body**:
        ```json
        {
          "token": "eyJ...your_access_token...o"
        }
        ```
    *   **Success Response**: `HTTP 200 OK` (no content) if valid.
    *   **Error Response**: `HTTP 401 Unauthorized` if invalid or expired.

## Permissions

*   **`AllowAny`**: No authentication required.
*   **`IsAuthenticated`**: User must be logged in.
*   **`IsAuthenticatedOrReadOnly`**: Logged-in users can write, anyone can read.
*   **`IsAdminOrReadOnly`**: Only staff/admin users can write, anyone can read.
*   **`IsAuthorOrReadOnly`**: Only the author of the object (or admin) can write, anyone can read.
*   **`IsOwnerOrAdmin`**: Only the owner of the object (or admin) can read/write.

## Main API Resources (CRUD Endpoints)

### 1. User Profile

*   `GET /api/v1/auth/me/`: Retrieve the authenticated user's profile.
    *   **Permissions**: `IsAuthenticated`
*   `PATCH /api/v1/auth/me/`: Update the authenticated user's profile.
    *   **Permissions**: `IsAuthenticated`
    *   **Request Body**: `{ "first_name": "New Name", "email": "new_email@example.com" }` (partial update)

### 2. Categories (`/api/v1/categories/`)

*   **Permissions**: `IsAdminOrReadOnly`
*   `GET /api/v1/categories/`: List all categories.
*   `GET /api/v1/categories/{slug}/`: Retrieve a single category by slug.
*   `POST /api/v1/categories/`: Create a new category.
*   `PATCH /api/v1/categories/{slug}/`: Update an existing category.
*   `DELETE /api/v1/categories/{slug}/`: Delete a category.

### 3. Tags (`/api/v1/tags/`)

*   **Permissions**: `IsAdminOrReadOnly`
*   `GET /api/v1/tags/`: List all tags.
*   `GET /api/v1/tags/{slug}/`: Retrieve a single tag by slug.
*   `POST /api/v1/tags/`: Create a new tag.
*   `PATCH /api/v1/tags/{slug}/`: Update an existing tag.
*   `DELETE /api/v1/tags/{slug}/`: Delete a tag.

### 4. Posts (`/api/v1/posts/`)

*   **Permissions**: `IsAuthorOrReadOnly` (for object-level), `IsAuthenticatedOrReadOnly` (for list/create).
    *   Unauthenticated users can only view `published` posts.
    *   Authenticated users can view `published` posts and their own `draft`/`archived` posts.
    *   Admin users can view/edit/delete all posts.
*   `GET /api/v1/posts/`: List posts.
    *   **Query Parameters**: `?status=published`, `?categories__slug=technology`, `?tags__slug=python`, `?search=keyword`
*   `GET /api/v1/posts/{slug}/`: Retrieve a single post by slug.
*   `POST /api/v1/posts/`: Create a new post. (Author is automatically set to the authenticated user).
*   `PATCH /api/v1/posts/{slug}/`: Update an existing post.
*   `DELETE /api/v1/posts/{slug}/`: Delete a post.
*   `POST /api/v1/posts/{slug}/publish/`: **Custom Action**: Publish a draft post.
    *   **Permissions**: `IsAdminUser`

### 5. Pages (`/api/v1/pages/`)

*   **Permissions**: Similar to Posts (`IsAuthorOrReadOnly`).
*   `GET /api/v1/pages/`: List pages.
    *   **Query Parameters**: `?is_published=true`, `?search=keyword`
*   `GET /api/v1/pages/{slug}/`: Retrieve a single page by slug.
*   `POST /api/v1/pages/`: Create a new page. (Author is automatically set to the authenticated user).
*   `PATCH /api/v1/pages/{slug}/`: Update an existing page.
*   `DELETE /api/v1/pages/{slug}/`: Delete a page.

### 6. Media Items (`/api/v1/media/`)

*   **Permissions**: `IsAuthenticated`, `IsOwnerOrAdmin` (for object-level).
*   `GET /api/v1/media/`: List media items (only own items for regular users, all for admins).
*   `GET /api/v1/media/{id}/`: Retrieve a single media item by ID.
*   `POST /api/v1/media/`: Upload a new media item.
    *   **Request Body**: `multipart/form-data` with `file` (required) and `title`, `description`, `alt_text`.
*   `PATCH /api/v1/media/{id}/`: Update media item metadata.
*   `DELETE /api/v1/media/{id}/`: Delete a media item (and its associated file).

## Error Handling

The API uses a custom exception handler to provide consistent error responses.

*   **`HTTP 400 Bad Request`**: Client-side validation errors (e.g., missing required fields, invalid data format).
*   **`HTTP 401 Unauthorized`**: Authentication credentials were not provided or are invalid/expired.
*   **`HTTP 403 Forbidden`**: User authenticated but lacks necessary permissions to perform the action.
*   **`HTTP 404 Not Found`**: The requested resource does not exist or the user does not have permission to access it.
*   **`HTTP 429 Too Many Requests`**: Rate limit exceeded.
*   **`HTTP 500 Internal Server Error`**: An unexpected error occurred on the server.

Example Error Response:
```json
{
  "message": "Authentication credentials were not provided.",
  "status_code": 401
}
```
Or for validation errors:
```json
{
  "username": [
    "A user with that username already exists."
  ],
  "email": [
    "Enter a valid email address."
  ],
  "status_code": 400
}
```
---
```