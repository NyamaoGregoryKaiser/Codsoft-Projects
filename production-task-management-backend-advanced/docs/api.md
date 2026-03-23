# Task Management System API Reference (v1)

This document provides a detailed overview of the RESTful API endpoints for the Task Management System. The API follows standard CRUD operations and uses JWT for authentication and role-based authorization.

**Base URL**: `/api/v1`

---

## Authentication

### `POST /auth/login`

Authenticate a user and receive an access token.

*   **Description**: Authenticates a user with their email and password, returning a JWT access token.
*   **Request Body (`application/x-www-form-urlencoded`)**:
    *   `username` (string, required): User's email.
    *   `password` (string, required): User's password.
*   **Responses**:
    *   `200 OK`: `{"access_token": "...", "token_type": "bearer"}`
    *   `401 Unauthorized`: `{"detail": "Incorrect email or password"}` or `"Inactive user"`

### `POST /auth/test-token`

Test the validity of an access token.

*   **Description**: Verifies if the provided JWT is valid and returns the current user's details.
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `User` object (schema below)
    *   `401 Unauthorized`: `{"detail": "Could not validate credentials"}`

### `GET /auth/me`

Get current authenticated user's details.

*   **Description**: Returns the details of the user associated with the provided access token.
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `User` object
    *   `401 Unauthorized`: `{"detail": "Could not validate credentials"}`

---

## Users

**Authorization**:
*   `GET /users/`: Admin/Superuser
*   `POST /users/`: Admin/Superuser
*   `GET /users/{user_id}`: Admin/Superuser
*   `PUT /users/{user_id}`: Admin/Superuser
*   `DELETE /users/{user_id}`: Superuser only (cannot delete self)

### User Schema

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Example User",
  "is_active": true,
  "is_superuser": false,
  "role": "user",
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-27T10:00:00.000Z"
}
```

### `GET /users/`

Retrieve a list of users.

*   **Query Parameters**:
    *   `skip` (int, optional): Number of items to skip (default: 0).
    *   `limit` (int, optional): Maximum number of items to return (default: 100).
*   **Headers**: `Authorization: Bearer <access_token>` (Admin/Superuser)
*   **Responses**:
    *   `200 OK`: `List[User]`
    *   `401 Unauthorized`
    *   `403 Forbidden`

### `POST /users/`

Create a new user.

*   **Request Body (`application/json`)**:
    *   `email` (string, required, EmailStr)
    *   `password` (string, required)
    *   `full_name` (string, required)
    *   `is_active` (boolean, optional, default: true)
    *   `is_superuser` (boolean, optional, default: false)
    *   `role` (enum, optional, default: "user"): "user" or "admin"
*   **Headers**: `Authorization: Bearer <access_token>` (Admin/Superuser)
*   **Responses**:
    *   `201 Created`: `User`
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `409 Conflict`: `{"detail": "User with this email already exists."}`

### `GET /users/{user_id}`

Retrieve a specific user by ID.

*   **Path Parameters**:
    *   `user_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>` (Admin/Superuser)
*   **Responses**:
    *   `200 OK`: `User`
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `404 Not Found`: `{"detail": "User with ID '{user_id}' not found."}`

### `PUT /users/{user_id}`

Update an existing user.

*   **Path Parameters**:
    *   `user_id` (int, required)
*   **Request Body (`application/json`)**:
    *   `email` (string, optional, EmailStr)
    *   `password` (string, optional): New password if changing.
    *   `full_name` (string, optional)
    *   `is_active` (boolean, optional)
    *   `is_superuser` (boolean, optional)
    *   `role` (enum, optional): "user" or "admin"
*   **Headers**: `Authorization: Bearer <access_token>` (Admin/Superuser)
*   **Responses**:
    *   `200 OK`: `User`
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `404 Not Found`: `{"detail": "User with ID '{user_id}' not found."}`

### `DELETE /users/{user_id}`

Delete a user.

*   **Path Parameters**:
    *   `user_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>` (Superuser only)
*   **Responses**:
    *   `200 OK`: `User` (the deleted user object)
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Cannot delete your own account."}`

---

## Projects

**Authorization**:
*   `GET /projects/`: Any active user (sees own projects or all if Admin/Superuser)
*   `POST /projects/`: Any active user
*   `GET /projects/{project_id}`: Project owner or Admin/Superuser
*   `PUT /projects/{project_id}`: Project owner or Admin/Superuser
*   `DELETE /projects/{project_id}`: Admin/Superuser only

### Project Schema

```json
{
  "id": 1,
  "title": "My First Project",
  "description": "A description of my first project.",
  "owner_id": 101,
  "owner": {
    "id": 101,
    "email": "owner@example.com",
    "full_name": "Project Owner",
    "is_active": true,
    "is_superuser": false,
    "role": "user"
  },
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-27T10:00:00.000Z"
}
```

### `GET /projects/`

Retrieve a list of projects.

*   **Query Parameters**:
    *   `skip` (int, optional)
    *   `limit` (int, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `List[Project]`
    *   `401 Unauthorized`

### `POST /projects/`

Create a new project.

*   **Request Body (`application/json`)**:
    *   `title` (string, required)
    *   `description` (string, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `201 Created`: `Project`
    *   `401 Unauthorized`

### `GET /projects/{project_id}`

Retrieve a specific project by ID.

*   **Path Parameters**:
    *   `project_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Project`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to access this project."}`
    *   `404 Not Found`: `{"detail": "Project with ID '{project_id}' not found."}`

### `PUT /projects/{project_id}`

Update an existing project.

*   **Path Parameters**:
    *   `project_id` (int, required)
*   **Request Body (`application/json`)**:
    *   `title` (string, optional)
    *   `description` (string, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Project`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to update this project."}`
    *   `404 Not Found`

### `DELETE /projects/{project_id}`

Delete a project.

*   **Path Parameters**:
    *   `project_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>` (Admin/Superuser only)
*   **Responses**:
    *   `200 OK`: `Project`
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `404 Not Found`

---

## Tasks

**Authorization**:
*   `GET /tasks/`: Any active user (sees tasks in projects they own or are assigned to, or all if Admin/Superuser)
*   `POST /tasks/`: Project owner or Admin/Superuser
*   `GET /tasks/{task_id}`: Creator, Assignee, Project Owner, or Admin/Superuser
*   `PUT /tasks/{task_id}`: Creator, Assignee, Project Owner, or Admin/Superuser
*   `DELETE /tasks/{task_id}`: Project Owner or Admin/Superuser

### Task Schema

```json
{
  "id": 1,
  "title": "Implement login functionality",
  "description": "Develop the user login endpoints and frontend integration.",
  "status": "In Progress",
  "priority": "High",
  "due_date": "2023-11-15T17:00:00.000Z",
  "project_id": 1,
  "assignee_id": 102,
  "creator_id": 101,
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-27T10:00:00.000Z",
  "assignee": { /* User schema (minimal) */ },
  "creator": { /* User schema (minimal) */ },
  "project": { /* ProjectMinimal schema */ }
}
```

### `GET /tasks/`

Retrieve a list of tasks.

*   **Query Parameters**:
    *   `skip` (int, optional)
    *   `limit` (int, optional)
    *   `project_id` (int, optional): Filter tasks by a specific project.
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `List[Task]`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to access tasks in this project."}` (if `project_id` is specified and user lacks access)

### `POST /tasks/`

Create a new task.

*   **Request Body (`application/json`)**:
    *   `title` (string, required)
    *   `description` (string, optional)
    *   `status` (enum, optional, default: "Open"): "Open", "In Progress", "Review", "Done"
    *   `priority` (enum, optional, default: "Medium"): "Low", "Medium", "High", "Urgent"
    *   `due_date` (datetime, optional): ISO 8601 format.
    *   `project_id` (int, required)
    *   `assignee_id` (int, optional): ID of the user assigned to the task.
    *   `creator_id` (int, required): Will be automatically set by the backend to the authenticated user's ID.
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `201 Created`: `Task`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to create tasks in this project."}`
    *   `404 Not Found`: `{"detail": "Project with ID '{project_id}' not found."}`

### `GET /tasks/{task_id}`

Retrieve a specific task by ID.

*   **Path Parameters**:
    *   `task_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Task`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to access this task."}`
    *   `404 Not Found`: `{"detail": "Task with ID '{task_id}' not found."}`

### `PUT /tasks/{task_id}`

Update an existing task.

*   **Path Parameters**:
    *   `task_id` (int, required)
*   **Request Body (`application/json`)**:
    *   `title` (string, optional)
    *   `description` (string, optional)
    *   `status` (enum, optional)
    *   `priority` (enum, optional)
    *   `due_date` (datetime, optional)
    *   `assignee_id` (int, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Task`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to update this task."}`
    *   `404 Not Found`

### `DELETE /tasks/{task_id}`

Delete a task.

*   **Path Parameters**:
    *   `task_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>` (Project Owner or Admin/Superuser)
*   **Responses**:
    *   `200 OK`: `Task`
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `404 Not Found`

---

## Comments

**Authorization**:
*   `GET /comments/task/{task_id}/`: User with access to the task
*   `POST /comments/`: User with access to the task
*   `PUT /comments/{comment_id}`: Comment author or Admin/Superuser
*   `DELETE /comments/{comment_id}`: Comment author, Project Owner, or Admin/Superuser

### Comment Schema

```json
{
  "id": 1,
  "content": "This task needs more detail on the UI/UX.",
  "task_id": 1,
  "author_id": 101,
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-27T10:00:00.000Z",
  "author": { /* User schema (minimal) */ },
  "task": { /* TaskMinimal schema */ }
}
```

### `GET /comments/task/{task_id}/`

Retrieve comments for a specific task.

*   **Path Parameters**:
    *   `task_id` (int, required)
*   **Query Parameters**:
    *   `skip` (int, optional)
    *   `limit` (int, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `List[Comment]`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to access this task's comments."}`
    *   `404 Not Found`: `{"detail": "Task with ID '{task_id}' not found."}`

### `POST /comments/`

Create a new comment on a task.

*   **Request Body (`application/json`)**:
    *   `content` (string, required)
    *   `task_id` (int, required)
    *   `author_id` (int, required): Will be automatically set by the backend.
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `201 Created`: `Comment`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to comment on this task."}`
    *   `404 Not Found`

### `PUT /comments/{comment_id}`

Update an existing comment.

*   **Path Parameters**:
    *   `comment_id` (int, required)
*   **Request Body (`application/json`)**:
    *   `content` (string, optional)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Comment`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to update this comment."}`
    *   `404 Not Found`

### `DELETE /comments/{comment_id}`

Delete a comment.

*   **Path Parameters**:
    *   `comment_id` (int, required)
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Responses**:
    *   `200 OK`: `Comment`
    *   `401 Unauthorized`
    *   `403 Forbidden`: `{"detail": "Not authorized to delete this comment."}`
    *   `404 Not Found`