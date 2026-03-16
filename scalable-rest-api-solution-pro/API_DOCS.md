```markdown
# Project Management API Documentation

This document provides comprehensive API documentation for the Project Management system. It outlines the available endpoints, HTTP methods, request/response formats, and authentication requirements.

## Base URL

`http://localhost:9080/api` (or `http://your-server-ip:9080/api` in production)

## Authentication

This API uses **JSON Web Tokens (JWT)** for authentication.
To access protected endpoints, you must:
1.  Register a new user using `/api/auth/register`.
2.  Log in with your credentials using `/api/auth/login` to receive a JWT.
3.  Include the JWT in the `Authorization` header of all subsequent requests to protected routes, in the format: `Authorization: Bearer <YOUR_JWT_TOKEN>`.

### Error Responses

All API errors return a JSON object with a `message` field, and an appropriate HTTP status code.

```json
{
  "message": "Error description"
}
```

Common Error Codes:
*   `400 Bad Request`: Invalid request body or parameters.
*   `401 Unauthorized`: Missing or invalid authentication token.
*   `403 Forbidden`: Authenticated user does not have permission to perform the action.
*   `404 Not Found`: The requested resource does not exist.
*   `409 Conflict`: Resource already exists (e.g., trying to register with an existing email).
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: An unexpected error occurred on the server.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`

Register a new user account.

*   **Request Body**:
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "created_at": "ISO 8601 datetime string",
      "updated_at": "ISO 8601 datetime string"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing fields (username, email, password).
    *   `409 Conflict`: User with this email already exists.
    *   `500 Internal Server Error`: Database error.

### `POST /api/auth/login`

Authenticate a user and receive a JWT token.

*   **Request Body**:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "message": "Login successful",
      "token": "your_jwt_token_here"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing fields (email, password).
    *   `401 Unauthorized`: Invalid credentials.
    *   `500 Internal Server Error`: Database error.

---

## 2. Project Endpoints (Protected)

All project endpoints require authentication with a valid JWT.

### `GET /api/projects`

Retrieve a list of all projects owned by the authenticated user.

*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "name": "Project Alpha",
        "description": "First project managed by user.",
        "owner_id": 1,
        "created_at": "2023-10-26T10:00:00Z",
        "updated_at": "2023-10-26T10:00:00Z"
      },
      {
        "id": 2,
        "name": "Project Beta",
        "description": "Second project.",
        "owner_id": 1,
        "created_at": "2023-10-27T11:30:00Z",
        "updated_at": "2023-10-27T11:30:00Z"
      }
    ]
    ```
*   **Error Responses**: `401 Unauthorized`, `500 Internal Server Error`.

### `GET /api/projects/:id`

Retrieve a specific project by its ID. The authenticated user must be the owner.

*   **Parameters**:
    *   `:id` (path): The ID of the project (integer).
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "First project managed by user.",
      "owner_id": 1,
      "created_at": "2023-10-26T10:00:00Z",
      "updated_at": "2023-10-26T10:00:00Z"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`
    *   `404 Not Found`: Project not found or not owned by the user.
    *   `500 Internal Server Error`

### `POST /api/projects`

Create a new project. The authenticated user will be set as the owner.

*   **Request Body**:
    ```json
    {
      "name": "string",
      "description": "string"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": 3,
      "name": "New Project",
      "description": "Details for the new project.",
      "owner_id": 1,
      "created_at": "2023-10-28T14:15:00Z",
      "updated_at": "2023-10-28T14:15:00Z"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing name or description.
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

### `PUT /api/projects/:id`

Update an existing project. The authenticated user must be the owner. Only provided fields will be updated.

*   **Parameters**:
    *   `:id` (path): The ID of the project (integer).
*   **Request Body**:
    ```json
    {
      "name": "string (optional)",
      "description": "string (optional)"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "Updated Project Name",
      "description": "New description for Project Alpha.",
      "owner_id": 1,
      "created_at": "2023-10-26T10:00:00Z",
      "updated_at": "2023-10-28T15:00:00Z"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON.
    *   `401 Unauthorized`
    *   `404 Not Found`: Project not found or not owned by the user.
    *   `500 Internal Server Error`

### `DELETE /api/projects/:id`

Delete a project. The authenticated user must be the owner. Deleting a project will also delete all associated tasks (due to `ON DELETE CASCADE`).

*   **Parameters**:
    *   `:id` (path): The ID of the project (integer).
*   **Response (204 No Content)**: Empty body on success.
*   **Error Responses**:
    *   `401 Unauthorized`
    *   `404 Not Found`: Project not found or not owned by the user.
    *   `500 Internal Server Error`

---

## 3. Task Endpoints (Protected)

All task endpoints require authentication with a valid JWT.

### `GET /api/tasks`

Retrieve a list of all tasks relevant to the authenticated user (either assigned to the user or belonging to a project owned by the user).

*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "title": "Implement user registration",
        "description": "Backend endpoint for new user signups.",
        "project_id": 1,
        "assigned_user_id": 1,
        "status": "IN_PROGRESS",
        "due_date": "2023-12-31T23:59:59Z",
        "created_at": "2023-10-26T10:00:00Z",
        "updated_at": "2023-10-26T10:00:00Z"
      },
      {
        "id": 2,
        "title": "Design API documentation",
        "description": "Write comprehensive OpenAPI docs.",
        "project_id": 1,
        "assigned_user_id": 1,
        "status": "OPEN",
        "due_date": "2024-01-15T17:00:00Z",
        "created_at": "2023-10-27T11:30:00Z",
        "updated_at": "2023-10-27T11:30:00Z"
      }
    ]
    ```
*   **Error Responses**: `401 Unauthorized`, `500 Internal Server Error`.

### `GET /api/tasks/:id`

Retrieve a specific task by its ID. The authenticated user must be either the assigned user or the owner of the associated project.

*   **Parameters**:
    *   `:id` (path): The ID of the task (integer).
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "title": "Implement user registration",
      "description": "Backend endpoint for new user signups.",
      "project_id": 1,
      "assigned_user_id": 1,
      "status": "IN_PROGRESS",
      "due_date": "2023-12-31T23:59:59Z",
      "created_at": "2023-10-26T10:00:00Z",
      "updated_at": "2023-10-26T10:00:00Z"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`
    *   `404 Not Found`: Task not found or not accessible by the user.
    *   `500 Internal Server Error`

### `POST /api/tasks`

Create a new task. The authenticated user must be the owner of the specified `project_id`.

*   **Request Body**:
    ```json
    {
      "title": "string",
      "description": "string (optional)",
      "project_id": "integer",
      "assigned_user_id": "integer",
      "status": "string (optional, default 'OPEN'. Valid: 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED')",
      "due_date": "ISO 8601 datetime string (optional)"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": 3,
      "title": "New Task",
      "description": "Task details.",
      "project_id": 1,
      "assigned_user_id": 1,
      "status": "OPEN",
      "due_date": "",
      "created_at": "2023-10-28T16:00:00Z",
      "updated_at": "2023-10-28T16:00:00Z"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing title, project_id, or assigned_user_id. Invalid status string.
    *   `401 Unauthorized`
    *   `403 Forbidden`: User does not own the project specified by `project_id`.
    *   `500 Internal Server Error`

### `PUT /api/tasks/:id`

Update an existing task.
*   **Project Owners**: Can modify any field, including `project_id` and `assigned_user_id`. They must also own the target `project_id` if changing it.
*   **Assigned Users**: Can modify `title`, `description`, `status`, and `due_date`. They cannot change `project_id` or `assigned_user_id`.

*   **Parameters**:
    *   `:id` (path): The ID of the task (integer).
*   **Request Body**:
    ```json
    {
      "title": "string (optional)",
      "description": "string (optional)",
      "project_id": "integer (optional, owner only)",
      "assigned_user_id": "integer (optional, owner only)",
      "status": "string (optional. Valid: 'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED')",
      "due_date": "ISO 8601 datetime string (optional)"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "title": "Updated Task Title",
      "description": "New description.",
      "project_id": 1,
      "assigned_user_id": 1,
      "status": "DONE",
      "due_date": "2023-12-31T23:59:59Z",
      "created_at": "2023-10-26T10:00:00Z",
      "updated_at": "2023-10-28T17:00:00Z"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid JSON. Invalid status string.
    *   `401 Unauthorized`
    *   `403 Forbidden`: User lacks permission for the requested update (e.g., non-owner trying to reassign).
    *   `404 Not Found`: Task not found or not accessible by the user.
    *   `500 Internal Server Error`

### `DELETE /api/tasks/:id`

Delete a task. The authenticated user **must be the owner of the associated project**.

*   **Parameters**:
    *   `:id` (path): The ID of the task (integer).
*   **Response (204 No Content)**: Empty body on success.
*   **Error Responses**:
    *   `401 Unauthorized`
    *   `403 Forbidden`: User is not the project owner.
    *   `404 Not Found`: Task not found.
    *   `500 Internal Server Error`
```