# API Documentation

This document provides a detailed overview of the API endpoints, their functionalities, request/response formats, and required authentication/authorization.

**Base URL:** `http://localhost:3000/api/v1` (Development)
**Interactive Swagger UI:** `http://localhost:3000/api-docs`

---

## Authentication

All protected routes require a JWT `Bearer` token in the `Authorization` header.

### `POST /auth/register`
*   **Description:** Registers a new user with a default role of 'member'.
*   **Request Body:** `application/json`
    ```json
    {
      "username": "johndoe",
      "email": "john.doe@example.com",
      "password": "securepassword123"
    }
    ```
*   **Responses:**
    *   `201 Created`: User registered successfully.
        ```json
        {
          "accessToken": "eyJ...",
          "user": {
            "id": "uuid-string",
            "username": "johndoe",
            "email": "john.doe@example.com",
            "role": "member"
          }
        }
        ```
    *   `400 Bad Request`: Missing fields or invalid password.
    *   `409 Conflict`: User with email/username already exists.

### `POST /auth/login`
*   **Description:** Authenticates a user and returns a JWT access token.
*   **Request Body:** `application/json`
    ```json
    {
      "email": "john.doe@example.com",
      "password": "securepassword123"
    }
    ```
*   **Responses:**
    *   `200 OK`: Login successful.
        ```json
        {
          "accessToken": "eyJ...",
          "user": {
            "id": "uuid-string",
            "username": "johndoe",
            "email": "john.doe@example.com",
            "role": "member"
          }
        }
        ```
    *   `401 Unauthorized`: Invalid credentials.

---

## User Management (Admin Only)

These routes require an `admin` role.

### `GET /users`
*   **Description:** Retrieves a list of all users.
*   **Authentication:** Required (Admin)
*   **Responses:**
    *   `200 OK`: List of users.
        ```json
        [
          {
            "id": "uuid-string",
            "username": "johndoe",
            "email": "john.doe@example.com",
            "role": "member",
            "createdAt": "ISO-Date",
            "updatedAt": "ISO-Date"
          }
        ]
        ```
    *   `401 Unauthorized`: No token or invalid token.
    *   `403 Forbidden`: User is not an admin.

### `GET /users/:id`
*   **Description:** Retrieves a single user by ID.
*   **Authentication:** Required (Admin)
*   **Parameters:**
    *   `id` (path): UUID of the user.
*   **Responses:**
    *   `200 OK`: User data.
    *   `404 Not Found`: User not found.

### `POST /users`
*   **Description:** Creates a new user (admin can assign roles).
*   **Authentication:** Required (Admin)
*   **Request Body:** `application/json`
    ```json
    {
      "username": "janedoe",
      "email": "jane.doe@example.com",
      "password": "initialpassword",
      "role": "admin" // or "member"
    }
    ```
*   **Responses:**
    *   `201 Created`: User created.
    *   `400 Bad Request`: Missing fields.
    *   `409 Conflict`: User with email/username already exists.

### `PUT /users/:id`
*   **Description:** Updates an existing user by ID.
*   **Authentication:** Required (Admin)
*   **Parameters:**
    *   `id` (path): UUID of the user.
*   **Request Body:** `application/json` (any combination of fields)
    ```json
    {
      "username": "janedoe_updated",
      "email": "jane.doe.updated@example.com",
      "role": "member"
    }
    ```
*   **Responses:**
    *   `200 OK`: User updated.
    *   `404 Not Found`: User not found.
    *   `409 Conflict`: New email/username already exists.

### `DELETE /users/:id`
*   **Description:** Deletes a user by ID.
*   **Authentication:** Required (Admin)
*   **Parameters:**
    *   `id` (path): UUID of the user.
*   **Responses:**
    *   `204 No Content`: User deleted successfully.
    *   `404 Not Found`: User not found.

---

## Project Management

These routes require authentication. Only the project creator or an admin can update/delete projects.

### `GET /projects`
*   **Description:** Retrieves a list of all projects.
*   **Authentication:** Required
*   **Responses:**
    *   `200 OK`: List of projects.
        ```json
        [
          {
            "id": "uuid-string",
            "name": "Website Redesign",
            "description": "Redesign the company website...",
            "createdById": "uuid-creator",
            "createdByUsername": "johndoe",
            "createdAt": "ISO-Date",
            "updatedAt": "ISO-Date"
          }
        ]
        ```

### `GET /projects/:id`
*   **Description:** Retrieves a single project by ID.
*   **Authentication:** Required
*   **Parameters:**
    *   `id` (path): UUID of the project.
*   **Responses:**
    *   `200 OK`: Project data (includes basic creator info and tasks if fetched with relations).
    *   `404 Not Found`: Project not found.

### `POST /projects`
*   **Description:** Creates a new project. The authenticated user becomes the creator.
*   **Authentication:** Required
*   **Request Body:** `application/json`
    ```json
    {
      "name": "New Mobile App",
      "description": "Develop a new cross-platform mobile application."
    }
    ```
*   **Responses:**
    *   `201 Created`: Project created.
    *   `400 Bad Request`: Missing name.
    *   `409 Conflict`: Project name already exists.

### `PUT /projects/:id`
*   **Description:** Updates an existing project by ID.
*   **Authentication:** Required (Project Creator or Admin)
*   **Parameters:**
    *   `id` (path): UUID of the project.
*   **Request Body:** `application/json` (any combination of fields)
    ```json
    {
      "name": "New Mobile App v2",
      "description": "Updated project description."
    }
    ```
*   **Responses:**
    *   `200 OK`: Project updated.
    *   `403 Forbidden`: User is not the creator or an admin.
    *   `404 Not Found`: Project not found.

### `DELETE /projects/:id`
*   **Description:** Deletes a project by ID.
*   **Authentication:** Required (Project Creator or Admin)
*   **Parameters:**
    *   `id` (path): UUID of the project.
*   **Responses:**
    *   `204 No Content`: Project deleted successfully.
    *   `403 Forbidden`: User is not the creator or an admin.
    *   `404 Not Found`: Project not found.

---

## Task Management

These routes require authentication. Only the project creator, task creator, or an admin can update/delete tasks.

### `GET /projects/:projectId/tasks`
*   **Description:** Retrieves all tasks for a specific project.
*   **Authentication:** Required
*   **Parameters:**
    *   `projectId` (path): UUID of the project.
*   **Responses:**
    *   `200 OK`: List of tasks.
        ```json
        [
          {
            "id": "uuid-string",
            "title": "Setup Database",
            "description": "Configure PostgreSQL database.",
            "status": "in_progress",
            "priority": "high",
            "projectId": "uuid-project",
            "projectName": "New Mobile App",
            "assignedToId": "uuid-user",
            "assignedToUsername": "johndoe",
            "createdById": "uuid-creator",
            "createdByUsername": "janedoe",
            "createdAt": "ISO-Date",
            "updatedAt": "ISO-Date"
          }
        ]
        ```
    *   `404 Not Found`: Project not found.

### `POST /projects/:projectId/tasks`
*   **Description:** Creates a new task within a specified project. The authenticated user becomes the creator.
*   **Authentication:** Required
*   **Parameters:**
    *   `projectId` (path): UUID of the project.
*   **Request Body:** `application/json`
    ```json
    {
      "title": "Implement User Login",
      "description": "Develop and test user authentication.",
      "status": "todo",
      "priority": "high",
      "assignedToId": "uuid-user-optional"
    }
    ```
*   **Responses:**
    *   `201 Created`: Task created.
    *   `400 Bad Request`: Missing title.
    *   `404 Not Found`: Project or assigned user not found.

### `GET /tasks/:id`
*   **Description:** Retrieves a single task by ID.
*   **Authentication:** Required
*   **Parameters:**
    *   `id` (path): UUID of the task.
*   **Responses:**
    *   `200 OK`: Task data.
    *   `404 Not Found`: Task not found.

### `PUT /tasks/:id`
*   **Description:** Updates an existing task by ID.
*   **Authentication:** Required (Project Creator, Task Creator, or Admin)
*   **Parameters:**
    *   `id` (path): UUID of the task.
*   **Request Body:** `application/json` (any combination of fields)
    ```json
    {
      "title": "Finalize User Login",
      "status": "done",
      "assignedToId": null // To unassign a user
    }
    ```
*   **Responses:**
    *   `200 OK`: Task updated.
    *   `403 Forbidden`: User does not have permission.
    *   `404 Not Found`: Task or assigned user not found.

### `DELETE /tasks/:id`
*   **Description:** Deletes a task by ID.
*   **Authentication:** Required (Project Creator, Task Creator, or Admin)
*   **Parameters:**
    *   `id` (path): UUID of the task.
*   **Responses:**
    *   `204 No Content`: Task deleted successfully.
    *   `403 Forbidden`: User does not have permission.
    *   `404 Not Found`: Task not found.
```

#### `pms-api/docs/ARCHITECTURE.md`
```markdown