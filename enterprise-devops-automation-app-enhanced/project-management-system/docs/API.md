```markdown
# Project Management System API Documentation

This document provides a detailed overview of the RESTful API endpoints for the Project Management System (PMS).

**Base URL:** `http://localhost:3001/api` (or `http://localhost/api` if accessed via Nginx in Docker Compose)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header, formatted as `Bearer <token>`.

### `POST /auth/register`

Registers a new user.

*   **Request Body:**
    ```json
    {
        "name": "User Name",
        "email": "user@example.com",
        "password": "Password123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
        "user": {
            "id": "uuid",
            "name": "User Name",
            "email": "user@example.com",
            "role": "user",
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
        },
        "tokens": {
            "access": {
                "token": "jwt_access_token",
                "expires": "timestamp"
            },
            "refresh": {
                "token": "jwt_refresh_token",
                "expires": "timestamp"
            }
        }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., email already taken, weak password).

### `POST /auth/login`

Logs in an existing user and returns JWT tokens.

*   **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "Password123"
    }
    ```
*   **Response (200 OK):** (Same as register response for `user` and `tokens` structure)
*   **Error Responses:**
    *   `401 Unauthorized`: Incorrect email or password.

### `POST /auth/logout`

Logs out the current user. (For this demo, it's mostly conceptual client-side token invalidation. In a real app, it would blacklist refresh tokens).

*   **Requires Authentication**
*   **Request Body:** (Empty)
*   **Response (204 No Content):** Success.

### `POST /auth/refresh-tokens`

(Placeholder) In a full production system, this would take a refresh token and return new access and refresh tokens. Not fully implemented for this demo.

## Users

Access to most user endpoints is restricted to `admin` roles.

### `POST /users`

Creates a new user. **(Admin only)**

*   **Requires Authentication (Admin)**
*   **Request Body:**
    ```json
    {
        "name": "New Admin",
        "email": "newadmin@example.com",
        "password": "AdminPassword123",
        "role": "admin"
    }
    ```
*   **Response (201 Created):** User object (without password).
*   **Error Responses:**
    *   `401 Unauthorized`: No token provided.
    *   `403 Forbidden`: User is not an admin.
    *   `400 Bad Request`: Invalid input.

### `GET /users`

Retrieves a list of all users. **(Admin only)**

*   **Requires Authentication (Admin)**
*   **Query Parameters (Optional):**
    *   `name`: Filter by user name.
    *   `email`: Filter by user email.
    *   `role`: Filter by user role (`user`, `admin`).
    *   `sortBy`: Field to sort by (e.g., `name:desc`, `createdAt:asc`).
    *   `limit`: Max number of results per page.
    *   `page`: Page number.
*   **Response (200 OK):** Array of user objects.
    ```json
    [
        {
            "id": "uuid",
            "name": "User Name",
            "email": "user@example.com",
            "role": "user",
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
        }
    ]
    ```

### `GET /users/:userId`

Retrieves a single user by ID. **(Admin only)**

*   **Requires Authentication (Admin)**
*   **Response (200 OK):** Single user object.
*   **Error Responses:**
    *   `404 Not Found`: User with `userId` not found.

### `PATCH /users/:userId`

Updates a user's information. **(Admin only)**

*   **Requires Authentication (Admin)**
*   **Request Body (Partial):**
    ```json
    {
        "name": "Updated User Name",
        "email": "updated@example.com",
        "password": "NewPassword123"
    }
    ```
*   **Response (200 OK):** Updated user object.

### `DELETE /users/:userId`

Deletes a user. **(Admin only)**

*   **Requires Authentication (Admin)**
*   **Response (204 No Content):** Success.

## Projects

### `POST /projects`

Creates a new project.

*   **Requires Authentication**
*   **Request Body:**
    ```json
    {
        "name": "New Project Title",
        "description": "A detailed description of the project.",
        "status": "pending", // Optional, default is 'pending'
        "startDate": "YYYY-MM-DDTHH:MM:SSZ", // Optional
        "endDate": "YYYY-MM-DDTHH:MM:SSZ" // Optional
    }
    ```
    *   `ownerId` is automatically set to the authenticated user's ID.
*   **Response (201 Created):** Project object including owner and initial members (owner).
    ```json
    {
        "id": "uuid",
        "name": "New Project Title",
        "description": "A detailed description of the project.",
        "status": "pending",
        "ownerId": "uuid_of_creator",
        "owner": { "id": "uuid", "name": "Creator Name", "email": "creator@email.com" },
        "members": [{ "id": "uuid", "name": "Creator Name", "email": "creator@email.com" }],
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
    }
    ```

### `GET /projects`

Retrieves a list of projects.
*   Authenticated users will see projects they own or are members of.
*   Admin users will see all projects.

*   **Requires Authentication**
*   **Response (200 OK):** Array of project objects.
    *(Includes nested `owner` and `members` data)*

### `GET /projects/:projectId`

Retrieves a single project by ID.

*   **Requires Authentication (Owner, Member, or Admin)**
*   **Response (200 OK):** Single project object.
    *(Includes nested `owner`, `members`, and `tasks` data)*
*   **Error Responses:**
    *   `403 Forbidden`: User is not authorized to view this project.

### `PATCH /projects/:projectId`

Updates a project's information.

*   **Requires Authentication (Owner or Admin)**
*   **Request Body (Partial):**
    ```json
    {
        "name": "Updated Project Name",
        "status": "active"
    }
    ```
*   **Response (200 OK):** Updated project object.

### `DELETE /projects/:projectId`

Deletes a project.

*   **Requires Authentication (Owner or Admin)**
*   **Response (204 No Content):** Success.

### `POST /projects/:projectId/members`

Adds a user as a member to a project.

*   **Requires Authentication (Owner or Admin)**
*   **Request Body:**
    ```json
    {
        "userId": "uuid_of_user_to_add"
    }
    ```
*   **Response (200 OK):** Updated project object including new member list.

### `DELETE /projects/:projectId/members`

Removes a user from a project's members.

*   **Requires Authentication (Owner or Admin)**
*   **Request Body:**
    ```json
    {
        "userId": "uuid_of_user_to_remove"
    }
    ```
*   **Response (200 OK):** Updated project object without the removed member.

## Tasks

### `POST /tasks`

Creates a new task within a project.

*   **Requires Authentication (Project Owner, Member, or Admin)**
*   **Request Body:**
    ```json
    {
        "projectId": "uuid_of_project",
        "title": "Task Title",
        "description": "Description of the task.", // Optional
        "status": "todo", // Optional, default 'todo'
        "priority": "medium", // Optional, default 'medium'
        "dueDate": "YYYY-MM-DDTHH:MM:SSZ", // Optional
        "assignedTo": "uuid_of_assignee" // Optional, must be a project member/owner
    }
    ```
*   **Response (201 Created):** Task object.
*   **Error Responses:**
    *   `403 Forbidden`: User not authorized to create tasks in this project.
    *   `400 Bad Request`: `assignedTo` user is not a member of the project.

### `GET /tasks`

Retrieves a list of tasks.

*   **Requires Authentication**
*   **Query Parameters (Optional):**
    *   `projectId`: Filter tasks by project ID.
    *   `assignedTo`: Filter tasks by assignee user ID.
    *   `status`: Filter by task status (`todo`, `in-progress`, `done`, `blocked`).
    *   `priority`: Filter by task priority (`low`, `medium`, `high`).
*   **Response (200 OK):** Array of task objects.
    *(Includes nested `project`, `assignee`, and `comments` data)*

### `GET /tasks/:taskId`

Retrieves a single task by ID.

*   **Requires Authentication (User must be Project Owner, Member, or Admin)**
*   **Response (200 OK):** Single task object.
    *(Includes nested `project`, `assignee`, and `comments` data)*
*   **Error Responses:**
    *   `403 Forbidden`: User is not authorized to view this task.

### `PATCH /tasks/:taskId`

Updates a task's information.

*   **Requires Authentication (Project Owner, Member, or Admin)**
*   **Request Body (Partial):**
    ```json
    {
        "status": "done",
        "assignedTo": "uuid_of_assignee_member"
    }
    ```
*   **Response (200 OK):** Updated task object.
*   **Error Responses:**
    *   `400 Bad Request`: `assignedTo` user is not a member of the project.

### `DELETE /tasks/:taskId`

Deletes a task.

*   **Requires Authentication (Project Owner or Admin)**
*   **Response (204 No Content):** Success.

## Comments

### `POST /comments`

Adds a new comment to a task.

*   **Requires Authentication (Project Owner, Member, or Admin)**
*   **Request Body:**
    ```json
    {
        "taskId": "uuid_of_task",
        "content": "This is a new comment."
    }
    ```
    *   `userId` is automatically set to the authenticated user's ID.
*   **Response (201 Created):** Comment object including user details.

### `GET /comments/:taskId/task`

Retrieves all comments for a specific task.

*   **Requires Authentication (User must be Project Owner, Member, or Admin for the task's project)**
*   **Response (200 OK):** Array of comment objects.
    *(Includes nested `user` data)*

### `PATCH /comments/:commentId`

Updates a comment.

*   **Requires Authentication (Comment Author, Project Owner, or Admin)**
*   **Request Body (Partial):**
    ```json
    {
        "content": "Updated comment content."
    }
    ```
*   **Response (200 OK):** Updated comment object.

### `DELETE /comments/:commentId`

Deletes a comment.

*   **Requires Authentication (Comment Author, Project Owner, or Admin)**
*   **Response (204 No Content):** Success.
```