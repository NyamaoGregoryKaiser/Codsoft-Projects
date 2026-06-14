```markdown
# DataViz Pro - Backend API Documentation (OpenAPI 3.0)

This document outlines the RESTful API endpoints for the DataViz Pro system. The API is built with NestJS and uses JWT for authentication and role-based access control.

You can interact with the API directly via the Swagger UI interface available at `/api/docs` when the backend is running.

## Authentication

All protected endpoints require a valid JWT `accessToken` to be passed in the `Authorization` header as a Bearer token:

`Authorization: Bearer <your_access_token>`

### `POST /auth/login`

Authenticates a user and returns an access token.

*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "userpassword"
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": "uuid",
            "email": "user@example.com",
            "username": "username",
            "role": "USER"
          }
        }
        ```
    *   `401 Unauthorized`: Invalid credentials.

## Users

Endpoints for managing user accounts. Accessible by `ADMIN` role, or `USER` for their own profile.

### `POST /api/users`

Create a new user. **(Admin only)**

*   **Request Body:** `CreateUserDto` (email, username, password, role)
*   **Responses:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`

### `GET /api/users`

Retrieve a list of all users. **(Admin only)**

*   **Responses:** `200 OK` (array of `User` objects without password)

### `GET /api/users/{id}`

Retrieve a single user by ID. **(Admin, or User for their own ID)**

*   **Parameters:** `id` (path) - User ID
*   **Responses:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### `PATCH /api/users/{id}`

Update a user's details. **(Admin, or User for their own ID)**

*   **Parameters:** `id` (path) - User ID
*   **Request Body:** `UpdateUserDto` (partial user data)
*   **Responses:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`

### `DELETE /api/users/{id}`

Delete a user. **(Admin only)**

*   **Parameters:** `id` (path) - User ID
*   **Responses:** `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## Data Sources

Endpoints for managing connections to external data sources.

### `POST /api/data-sources`
Create a new data source.

... (similar structure for GET, PATCH, DELETE for Data Sources, Dashboards, Charts, Chart Data)

---

**Detailed API specifications can be found on the running Swagger UI at `/api/docs`.**
```