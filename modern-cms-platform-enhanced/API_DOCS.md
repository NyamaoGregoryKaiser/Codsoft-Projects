```markdown
# CMS API Documentation (OpenAPI/Swagger Conceptual Outline)

This document outlines the RESTful API endpoints for the CMS backend.
A full OpenAPI/Swagger specification (`openapi.yaml` or `swagger.json`) would typically be generated or written to provide machine-readable documentation.

## Base URL

`/api`

## Authentication

All protected routes require a JSON Web Token (JWT) in the `Authorization` header: `Authorization: Bearer <token>`.

### Auth Endpoints

*   `POST /auth/register`
    *   **Description**: Register a new user account.
    *   **Request Body**:
        ```json
        {
            "username": "string",
            "email": "string",
            "password": "string",
            "role": "string" (optional, default: "viewer")
        }
        ```
    *   **Responses**:
        *   `201 Created`: User registered successfully.
        *   `400 Bad Request`: Validation error (e.g., email already exists, invalid password).
*   `POST /auth/login`
    *   **Description**: Authenticate user and return a JWT.
    *   **Request Body**:
        ```json
        {
            "email": "string",
            "password": "string"
        }
        ```
    *   **Responses**:
        *   `200 OK`: Returns user info and JWT.
        *   `401 Unauthorized`: Invalid credentials.
        *   `403 Forbidden`: Account inactive.
*   `GET /auth/me`
    *   **Description**: Get the profile of the authenticated user.
    *   **Authentication**: Required (JWT)
    *   **Responses**:
        *   `200 OK`: Returns current user's details (excluding password).
        *   `401 Unauthorized`: Invalid or missing token.

### User Management Endpoints (Admin Only)

*   **Authentication**: Required (JWT, Role: `admin`)
*   `GET /users`
    *   **Description**: Get a list of all users.
    *   **Responses**:
        *   `200 OK`: Array of user objects (excluding passwords).
        *   `401 Unauthorized`: Invalid or missing token.
        *   `403 Forbidden`: Insufficient role.
*   `GET /users/{id}`
    *   **Description**: Get a single user by ID.
    *   **Parameters**: `id` (UUID, path)
    *   **Responses**:
        *   `200 OK`: User object.
        *   `404 Not Found`: User not found.
*   `PUT /users/{id}`
    *   **Description**: Update a user's information.
    *   **Parameters**: `id` (UUID, path)
    *   **Request Body**:
        ```json
        {
            "username": "string" (optional),
            "email": "string" (optional),
            "role": "string" (optional, "admin" | "author" | "viewer"),
            "isActive": "boolean" (optional)
        }
        ```
    *   **Responses**:
        *   `200 OK`: User updated successfully.
        *   `400 Bad Request`: Validation error.
        *   `404 Not Found`: User not found.
*   `DELETE /users/{id}`
    *   **Description**: Delete a user.
    *   **Parameters**: `id` (UUID, path)
    *   **Responses**:
        *   `200 OK`: User deleted successfully.
        *   `404 Not Found`: User not found.

### Content Management (Posts) Endpoints

*   `GET /posts/published`
    *   **Description**: Get all published posts (publicly accessible).
    *   **Authentication**: None
    *   **Responses**:
        *   `200 OK`: Array of published post objects.
*   `GET /posts/{identifier}`
    *   **Description**: Get a single post by ID or slug.
    *   **Authentication**: Optional (if authenticated as admin/author, can see drafts/archived if matching).
    *   **Parameters**: `identifier` (string, path - UUID or slug)
    *   **Responses**:
        *   `200 OK`: Post object.
        *   `404 Not Found`: Post not found.
*   `GET /posts`
    *   **Description**: Get all posts (includes drafts/archived for `admin`/`author` roles).
    *   **Authentication**: Required (JWT, Role: `admin` | `author`)
    *   **Responses**:
        *   `200 OK`: Array of post objects.
*   `POST /posts`
    *   **Description**: Create a new post.
    *   **Authentication**: Required (JWT, Role: `admin` | `author`)
    *   **Request Body**:
        ```json
        {
            "title": "string",
            "content": "string",
            "excerpt": "string" (optional),
            "status": "string" (optional, "draft" | "published" | "archived", default: "draft"),
            "featuredImage": "string" (optional, URL/path),
            "categoryId": "UUID" (optional),
            "tagIds": ["UUID"] (optional)
        }
        ```
    *   **Responses**:
        *   `201 Created`: Post created successfully.
        *   `400 Bad Request`: Validation error.
        *   `409 Conflict`: Slug already exists.
*   `PUT /posts/{id}`
    *   **Description**: Update an existing post. Authors can only update their own posts.
    *   **Authentication**: Required (JWT, Role: `admin` | `author`)
    *   **Parameters**: `id` (UUID, path)
    *   **Request Body**: (Any field from POST request, optional)
    *   **Responses**:
        *   `200 OK`: Post updated successfully.
        *   `403 Forbidden`: Unauthorized to update.
        *   `404 Not Found`: Post not found.
*   `DELETE /posts/{id}`
    *   **Description**: Delete a post. Authors can only delete their own posts.
    *   **Authentication**: Required (JWT, Role: `admin` | `author`)
    *   **Parameters**: `id` (UUID, path)
    *   **Responses**:
        *   `200 OK`: Post deleted successfully.
        *   `403 Forbidden`: Unauthorized to delete.
        *   `404 Not Found`: Post not found.
*   `POST /posts/{id}/image`
    *   **Description**: Upload a featured image for a post.
    *   **Authentication**: Required (JWT, Role: `admin` | `author`)
    *   **Request Body**: `multipart/form-data` with a `file` field named `featuredImage`.
    *   **Responses**:
        *   `200 OK`: Image uploaded successfully, returns path.
        *   `400 Bad Request`: No file uploaded or invalid file type.

### Category Management Endpoints (Admin Only)

*   **Authentication**: Required (JWT, Role: `admin`) for POST, PUT, DELETE.
*   `GET /categories`
    *   **Description**: Get all categories.
    *   **Authentication**: None
    *   **Responses**:
        *   `200 OK`: Array of category objects.
*   `POST /categories`
    *   **Description**: Create a new category.
    *   **Request Body**:
        ```json
        {
            "name": "string",
            "description": "string" (optional)
        }
        ```
    *   **Responses**:
        *   `201 Created`: Category created successfully.
*   `PUT /categories/{id}`
    *   **Description**: Update a category.
    *   **Parameters**: `id` (UUID, path)
    *   **Request Body**: (Any field from POST request, optional)
    *   **Responses**:
        *   `200 OK`: Category updated successfully.
*   `DELETE /categories/{id}`
    *   **Description**: Delete a category. Posts associated with this category will have their `categoryId` set to `NULL`.
    *   **Parameters**: `id` (UUID, path)
    *   **Responses**:
        *   `200 OK`: Category deleted successfully.

### Tag Management Endpoints (Admin Only)

*   **Authentication**: Required (JWT, Role: `admin`) for POST, PUT, DELETE.
*   `GET /tags`
    *   **Description**: Get all tags.
    *   **Authentication**: None
    *   **Responses**:
        *   `200 OK`: Array of tag objects.
*   `POST /tags`
    *   **Description**: Create a new tag.
    *   **Request Body**:
        ```json
        {
            "name": "string"
        }
        ```
    *   **Responses**:
        *   `201 Created`: Tag created successfully.
*   `PUT /tags/{id}`
    *   **Description**: Update a tag.
    *   **Parameters**: `id` (UUID, path)
    *   **Request Body**: (Any field from POST request, optional)
    *   **Responses**:
        *   `200 OK`: Tag updated successfully.
*   `DELETE /tags/{id}`
    *   **Description**: Delete a tag. Associations with posts will be removed.
    *   **Parameters**: `id` (UUID, path)
    *   **Responses**:
        *   `200 OK`: Tag deleted successfully.
```