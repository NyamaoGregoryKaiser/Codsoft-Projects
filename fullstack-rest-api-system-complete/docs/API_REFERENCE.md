# Horizon PMS API Reference

This document provides a comprehensive reference for the Horizon PMS RESTful API.

**Base URL:** `http://localhost:3000/api` (or your deployed backend URL)

## Authentication

All protected endpoints require a JWT Access Token in the `Authorization` header: `Bearer <access_token>`.

### 1. Register User

`POST /auth/register`

Registers a new user account.

**Request Body:**

```json
{
  "email": "string",         // Required, must be unique
  "password": "string",      // Required, min 8 characters
  "firstName": "string",     // Required, min 2 characters
  "lastName": "string"       // Required, min 2 characters
}
```

**Responses:**

*   **201 Created:**
    ```json
    {
      "user": {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "user"
      },
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token"
    }
    ```
*   **400 Bad Request:** Invalid input data (e.g., malformed email, short password).
*   **409 Conflict:** Email already registered.
*   **500 Internal Server Error:** Server-side issues.

### 2. Login User

`POST /auth/login`

Authenticates a user and returns JWT tokens.

**Request Body:**

```json
{
  "email": "string",         // Required
  "password": "string"       // Required
}
```

**Responses:**

*   **200 OK:**
    ```json
    {
      "user": {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "user"
      },
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token"
    }
    ```
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** Invalid credentials.
*   **500 Internal Server Error:** Server-side issues.

### 3. Refresh Access Token

`POST /auth/refresh-token`

Uses a refresh token to obtain a new access token.

**Request Body:**

```json
{
  "refreshToken": "jwt_token" // Required
}
```

**Responses:**

*   **200 OK:**
    ```json
    {
      "accessToken": "new_jwt_token"
    }
    ```
*   **400 Bad Request:** Missing refresh token.
*   **403 Forbidden:** Invalid or expired refresh token.
*   **500 Internal Server Error:** Server-side issues.

---

## User Endpoints

### 1. Get All Users (Admin Only)

`GET /users`

Retrieves a list of all registered users.

**Authentication:** Required (Admin Role)

**Responses:**

*   **200 OK:**
    ```json
    [
      {
        "id": "uuid",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "user" | "admin",
        "createdAt": "date-time",
        "updatedAt": "date-time"
      }
    ]
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Insufficient permissions (not an Admin).
*   **500 Internal Server Error:** Server-side issues.

### 2. Get User By ID (Admin Only)

`GET /users/:id`

Retrieves details of a specific user.

**Authentication:** Required (Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the user.

**Responses:**

*   **200 OK:** (Same as individual user object in "Get All Users" response)
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Insufficient permissions (not an Admin).
*   **404 Not Found:** User not found.
*   **500 Internal Server Error:** Server-side issues.

### 3. Update Own Profile

`PUT /users/me`

Updates the authenticated user's own profile information.

**Authentication:** Required (User or Admin Role)

**Request Body:**

```json
{
  "email"?: "string",         // Optional, must be unique if provided
  "firstName"?: "string",     // Optional, min 2 characters
  "lastName"?: "string"       // Optional, min 2 characters
}
```

**Responses:**

*   **200 OK:** (Updated user object, without password)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **409 Conflict:** Email already in use by another user.
*   **500 Internal Server Error:** Server-side issues.

### 4. Update User By ID (Admin Only)

`PUT /users/:id`

Updates another user's profile information. Admin users can also change `role`.

**Authentication:** Required (Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the user to update.

**Request Body:**

```json
{
  "email"?: "string",         // Optional, must be unique if provided
  "firstName"?: "string",     // Optional, min 2 characters
  "lastName"?: "string",      // Optional, min 2 characters
  "role"?: "user" | "admin"   // Optional (Admin only can change)
}
```

**Responses:**

*   **200 OK:** (Updated user object, without password)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Insufficient permissions (not an Admin).
*   **404 Not Found:** User not found.
*   **409 Conflict:** Email already in use by another user.
*   **500 Internal Server Error:** Server-side issues.

### 5. Delete User By ID (Admin Only)

`DELETE /users/:id`

Deletes a user account.

**Authentication:** Required (Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the user to delete.

**Responses:**

*   **204 No Content:** User successfully deleted.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Insufficient permissions (not an Admin).
*   **404 Not Found:** User not found.
*   **500 Internal Server Error:** Server-side issues.

---

## Project Endpoints

### 1. Create Project

`POST /projects`

Creates a new project. The authenticated user becomes the project owner.

**Authentication:** Required (User or Admin Role)

**Request Body:**

```json
{
  "name": "string",         // Required, min 3, max 255 characters
  "description"?: "string", // Optional
  "startDate"?: "YYYY-MM-DD", // Optional
  "endDate"?: "YYYY-MM-DD"    // Optional
}
```

**Responses:**

*   **201 Created:**
    ```json
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "ownerId": "uuid",
      "createdAt": "date-time",
      "updatedAt": "date-time"
    }
    ```
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **500 Internal Server Error:** Server-side issues.

### 2. Get All Projects

`GET /projects`

Retrieves a list of all projects.

**Authentication:** Required (User or Admin Role)

**Responses:**

*   **200 OK:**
    ```json
    [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "createdAt": "date-time",
        "updatedAt": "date-time",
        "owner": {
          "id": "uuid",
          "email": "string",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ]
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **500 Internal Server Error:** Server-side issues.

### 3. Get Project By ID

`GET /projects/:id`

Retrieves details of a specific project, including its tasks and their assignees.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the project.

**Responses:**

*   **200 OK:**
    ```json
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "createdAt": "date-time",
      "updatedAt": "date-time",
      "owner": { /* user object */ },
      "tasks": [
        {
          "id": "uuid",
          "title": "string",
          "status": "todo" | "in_progress" | "done",
          "priority": "low" | "medium" | "high",
          "dueDate": "YYYY-MM-DD",
          "assignee": { /* user object partial */ }
        }
      ]
    }
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **404 Not Found:** Project not found.
*   **500 Internal Server Error:** Server-side issues.

### 4. Update Project

`PUT /projects/:id`

Updates an existing project. Only the project owner or an Admin can update.
Only an Admin can change `ownerId`.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the project to update.

**Request Body:**

```json
{
  "name"?: "string",         // Optional, min 3, max 255 characters
  "description"?: "string", // Optional
  "startDate"?: "YYYY-MM-DD", // Optional
  "endDate"?: "YYYY-MM-DD",    // Optional
  "ownerId"?: "uuid"          // Optional, Admin only
}
```

**Responses:**

*   **200 OK:** (Updated project object)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to update this project or change ownership.
*   **404 Not Found:** Project or new owner not found.
*   **500 Internal Server Error:** Server-side issues.

### 5. Delete Project

`DELETE /projects/:id`

Deletes a project and all its associated tasks and comments. Only the project owner or an Admin can delete.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the project to delete.

**Responses:**

*   **204 No Content:** Project successfully deleted.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to delete this project.
*   **404 Not Found:** Project not found.
*   **500 Internal Server Error:** Server-side issues.

---

## Task Endpoints

### 1. Create Task

`POST /tasks`

Creates a new task within a project. Only the project owner can create tasks.

**Authentication:** Required (User or Admin Role)

**Request Body:**

```json
{
  "title": "string",         // Required, min 3, max 255 characters
  "description"?: "string", // Optional
  "status"?: "todo" | "in_progress" | "done", // Optional, default 'todo'
  "priority"?: "low" | "medium" | "high",     // Optional, default 'medium'
  "dueDate"?: "YYYY-MM-DD",   // Optional
  "projectId": "uuid",       // Required, ID of the parent project
  "assigneeId"?: "uuid"       // Optional, ID of the user to assign
}
```

**Responses:**

*   **201 Created:** (New task object)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to create tasks for this project.
*   **404 Not Found:** Project or assignee not found.
*   **500 Internal Server Error:** Server-side issues.

### 2. Get Tasks by Project ID

`GET /tasks/project/:projectId`

Retrieves all tasks for a specific project.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `projectId`: `uuid` - The ID of the project.

**Responses:**

*   **200 OK:**
    ```json
    [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "status": "todo",
        "priority": "medium",
        "dueDate": "YYYY-MM-DD",
        "createdAt": "date-time",
        "updatedAt": "date-time",
        "assignee": { /* user object partial */ }
      }
    ]
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **500 Internal Server Error:** Server-side issues.

### 3. Get Task By ID

`GET /tasks/:id`

Retrieves details of a specific task, including its comments.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the task.

**Responses:**

*   **200 OK:**
    ```json
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "status": "todo",
      "priority": "medium",
      "dueDate": "YYYY-MM-DD",
      "createdAt": "date-time",
      "updatedAt": "date-time",
      "projectId": "uuid",
      "project": { "id": "uuid", "name": "string", "ownerId": "uuid" },
      "assignee": { /* user object partial */ },
      "comments": [
        {
          "id": "uuid",
          "content": "string",
          "createdAt": "date-time",
          "user": { "id": "uuid", "firstName": "string", "lastName": "string" }
        }
      ]
    }
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **404 Not Found:** Task not found.
*   **500 Internal Server Error:** Server-side issues.

### 4. Update Task

`PUT /tasks/:id`

Updates an existing task. Only the project owner or the assigned user can update. Only the project owner can change the assignee.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the task to update.

**Request Body:**

```json
{
  "title"?: "string",         // Optional, min 3, max 255 characters
  "description"?: "string", // Optional
  "status"?: "todo" | "in_progress" | "done", // Optional
  "priority"?: "low" | "medium" | "high",     // Optional
  "dueDate"?: "YYYY-MM-DD",   // Optional
  "assigneeId"?: "uuid"       // Optional, project owner only
}
```

**Responses:**

*   **200 OK:** (Updated task object)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to update this task or change assignee.
*   **404 Not Found:** Task or assignee not found.
*   **500 Internal Server Error:** Server-side issues.

### 5. Delete Task

`DELETE /tasks/:id`

Deletes a task and all its associated comments. Only the project owner can delete tasks.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the task to delete.

**Responses:**

*   **204 No Content:** Task successfully deleted.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to delete this task.
*   **404 Not Found:** Task not found.
*   **500 Internal Server Error:** Server-side issues.

---

## Comment Endpoints

### 1. Create Comment

`POST /comments`

Adds a new comment to a task. The authenticated user is the comment author.

**Authentication:** Required (User or Admin Role)

**Request Body:**

```json
{
  "content": "string",       // Required, min 1, max 1000 characters
  "taskId": "uuid"           // Required, ID of the parent task
}
```

**Responses:**

*   **201 Created:** (New comment object)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **404 Not Found:** Task not found.
*   **500 Internal Server Error:** Server-side issues.

### 2. Get Comments by Task ID

`GET /comments/task/:taskId`

Retrieves all comments for a specific task.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `taskId`: `uuid` - The ID of the task.

**Responses:**

*   **200 OK:**
    ```json
    [
      {
        "id": "uuid",
        "content": "string",
        "createdAt": "date-time",
        "updatedAt": "date-time",
        "userId": "uuid",
        "taskId": "uuid",
        "user": { "id": "uuid", "firstName": "string", "lastName": "string" }
      }
    ]
    ```
*   **401 Unauthorized:** No token or invalid token.
*   **500 Internal Server Error:** Server-side issues.

### 3. Update Comment

`PUT /comments/:id`

Updates an existing comment. Only the comment author can update their comment.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the comment to update.

**Request Body:**

```json
{
  "content": "string"        // Required, min 1, max 1000 characters
}
```

**Responses:**

*   **200 OK:** (Updated comment object)
*   **400 Bad Request:** Invalid input data.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to update this comment.
*   **404 Not Found:** Comment not found.
*   **500 Internal Server Error:** Server-side issues.

### 4. Delete Comment

`DELETE /comments/:id`

Deletes a comment. Only the comment author can delete their comment.

**Authentication:** Required (User or Admin Role)

**Path Parameters:**

*   `id`: `uuid` - The ID of the comment to delete.

**Responses:**

*   **204 No Content:** Comment successfully deleted.
*   **401 Unauthorized:** No token or invalid token.
*   **403 Forbidden:** Not authorized to delete this comment.
*   **404 Not Found:** Comment not found.
*   **500 Internal Server Error:** Server-side issues.
```

#### `docs/ARCHITECTURE.md`
```markdown