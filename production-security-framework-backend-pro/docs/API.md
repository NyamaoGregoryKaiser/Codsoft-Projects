```markdown
# API Documentation: Secure Task Management System (Conceptual)

This document provides a conceptual overview and examples of the API endpoints for the Secure Task Management System. For the live and interactive documentation, please refer to the automatically generated **Swagger UI** (`http://localhost:8000/docs`) or **ReDoc** (`http://localhost:8000/redoc`) when the backend is running.

---

## Base URL

All API endpoints are prefixed with `/api/v1`.

Example: `http://localhost:8000/api/v1`

---

## Authentication

### 1. Register User

*   **Endpoint:** `POST /api/v1/auth/register`
*   **Description:** Creates a new user account.
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123",
      "full_name": "John Doe",
      "role": "user" # Will default to 'user' if not provided
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_active": true,
      "role": "user",
      "id": 1,
      "created_at": "2023-01-01T12:00:00.000Z",
      "updated_at": "2023-01-01T12:00:00.000Z"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If email already exists.
    *   `422 Unprocessable Entity`: If validation fails (e.g., password too short).

### 2. Login User

*   **Endpoint:** `POST /api/v1/auth/login`
*   **Description:** Authenticates a user and returns JWT access and refresh tokens.
*   **Request Body (Form Data - `application/x-www-form-urlencoded`):**
    *   `username`: User's email
    *   `password`: User's password
*   **Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "token_type": "bearer",
      "refresh_token": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Incorrect username or password.
    *   `400 Bad Request`: User is inactive.

### 3. Refresh Access Token

*   **Endpoint:** `POST /api/v1/auth/refresh`
*   **Description:** Uses a refresh token to obtain a new access token.
*   **Request Body (JSON):**
    ```json
    {
      "refresh_token": "eyJhbGciOiJIUzI1Ni..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "token_type": "bearer"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or expired refresh token.

### 4. Logout User

*   **Endpoint:** `POST /api/v1/auth/logout`
*   **Description:** Invalidates the current access token, effectively logging out the user from that session.
*   **Authentication:** Requires valid Access Token in `Authorization: Bearer <token>` header.
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    {
      "message": "Successfully logged out"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing token.

---

## Users

**Authentication:** All user endpoints (except `register` and `login`) require a valid Access Token in the `Authorization: Bearer <token>` header.

### 1. Get Current User

*   **Endpoint:** `GET /api/v1/users/me`
*   **Description:** Retrieves details of the currently authenticated user.
*   **Authentication:** Requires `user` or `admin` role.
*   **Response (200 OK):**
    ```json
    {
      "email": "current@example.com",
      "full_name": "Current User",
      "is_active": true,
      "role": "user",
      "id": 1,
      "created_at": "...",
      "updated_at": "..."
    }
    ```

### 2. Update Current User

*   **Endpoint:** `PUT /api/v1/users/me`
*   **Description:** Updates details of the currently authenticated user. Non-admin users cannot change their `role`.
*   **Authentication:** Requires `user` or `admin` role.
*   **Request Body (JSON - partial update):**
    ```json
    {
      "full_name": "New Full Name",
      "password": "newsecurepassword",
      "is_active": true # Can only be set by admin or self if admin
    }
    ```
*   **Response (200 OK):** Updated user object.
*   **Error Responses:**
    *   `403 Forbidden`: Attempt to change role as non-admin.
    *   `400 Bad Request`: Email already in use.

### 3. Get All Users (Admin Only)

*   **Endpoint:** `GET /api/v1/users/`
*   **Description:** Retrieves a list of all registered users.
*   **Authentication:** Requires `admin` role.
*   **Query Parameters:**
    *   `skip`: Number of records to skip (default: 0)
    *   `limit`: Maximum number of records to return (default: 100)
*   **Response (200 OK):** An array of user objects.
*   **Error Responses:**
    *   `403 Forbidden`: If user is not an admin.

### 4. Get User by ID (Admin Only)

*   **Endpoint:** `GET /api/v1/users/{user_id}`
*   **Description:** Retrieves details of a specific user by ID.
*   **Authentication:** Requires `admin` role.
*   **Response (200 OK):** User object.
*   **Error Responses:**
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: If user is not an admin.

### 5. Update User by ID (Admin Only)

*   **Endpoint:** `PUT /api/v1/users/{user_id}`
*   **Description:** Updates details of a specific user by ID.
*   **Authentication:** Requires `admin` role.
*   **Request Body (JSON - partial update):** Same as `PUT /api/v1/users/me`.
*   **Response (200 OK):** Updated user object.
*   **Error Responses:**
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: If user is not an admin.

### 6. Delete User by ID (Admin Only)

*   **Endpoint:** `DELETE /api/v1/users/{user_id}`
*   **Description:** Deletes a specific user by ID.
*   **Authentication:** Requires `admin` role.
*   **Response (200 OK):** Deleted user object.
*   **Error Responses:**
    *   `404 Not Found`: User not found.
    *   `403 Forbidden`: If user is not an admin.

---

## Projects

**Authentication:** All project endpoints require a valid Access Token.

### 1. Get Projects

*   **Endpoint:** `GET /api/v1/projects/`
*   **Description:** Retrieves projects. Regular users see only their own projects. Admins see all projects.
*   **Authentication:** Requires `user` or `admin` role.
*   **Query Parameters:** `skip`, `limit`.
*   **Response (200 OK):** An array of project objects.

### 2. Create Project

*   **Endpoint:** `POST /api/v1/projects/`
*   **Description:** Creates a new project, assigned to the current user as owner.
*   **Authentication:** Requires `user` or `admin` role.
*   **Request Body (JSON):**
    ```json
    {
      "title": "My First Project",
      "description": "This is a description of my first project."
    }
    ```
*   **Response (201 Created):** New project object.

### 3. Get Project by ID

*   **Endpoint:** `GET /api/v1/projects/{project_id}`
*   **Description:** Retrieves details of a specific project by ID.
*   **Authentication:** Requires `user` (if owner) or `admin` role.
*   **Response (200 OK):** Project object.
*   **Error Responses:**
    *   `404 Not Found`: Project not found.
    *   `403 Forbidden`: If user is not the owner or an admin.

### 4. Update Project by ID

*   **Endpoint:** `PUT /api/v1/projects/{project_id}`
*   **Description:** Updates details of a specific project by ID.
*   **Authentication:** Requires `user` (if owner) or `admin` role.
*   **Request Body (JSON - partial update):**
    ```json
    {
      "title": "Updated Project Title",
      "description": "An updated description."
    }
    ```
*   **Response (200 OK):** Updated project object.
*   **Error Responses:**
    *   `404 Not Found`: Project not found.
    *   `403 Forbidden`: If user is not the owner or an admin.

### 5. Delete Project by ID

*   **Endpoint:** `DELETE /api/v1/projects/{project_id}`
*   **Description:** Deletes a specific project by ID.
*   **Authentication:** Requires `user` (if owner) or `admin` role.
*   **Response (200 OK):** Deleted project object.
*   **Error Responses:**
    *   `404 Not Found`: Project not found.
    *   `403 Forbidden`: If user is not the owner or an admin.

---

## Tasks

**Authentication:** All task endpoints require a valid Access Token.

### 1. Get Tasks by Project ID

*   **Endpoint:** `GET /api/v1/tasks/by-project/{project_id}`
*   **Description:** Retrieves all tasks associated with a specific project.
*   **Authentication:** Requires `user` (if project owner) or `admin` role.
*   **Query Parameters:** `skip`, `limit`.
*   **Response (200 OK):** An array of task objects.
*   **Error Responses:**
    *   `404 Not Found`: Project not found.
    *   `403 Forbidden`: If user is not the project owner or an admin.

### 2. Create Task

*   **Endpoint:** `POST /api/v1/tasks/`
*   **Description:** Creates a new task within a specified project. The current user must be the project owner or an admin.
*   **Authentication:** Requires `user` (if project owner) or `admin` role.
*   **Request Body (JSON):**
    ```json
    {
      "title": "New Task for Project",
      "description": "Details for the new task.",
      "status": "pending", # Optional, defaults to "pending"
      "project_id": 1,
      "assigned_to_id": 2 # Optional, ID of user to assign to
    }
    ```
*   **Response (201 Created):** New task object.
*   **Error Responses:**
    *   `404 Not Found`: Project not found.
    *   `403 Forbidden`: User not authorized to create tasks for this project.
    *   `400 Bad Request`: Assigned user not found.

### 3. Get Task by ID

*   **Endpoint:** `GET /api/v1/tasks/{task_id}`
*   **Description:** Retrieves details of a specific task by ID.
*   **Authentication:** Requires `user` (if project owner or assigned to task) or `admin` role.
*   **Response (200 OK):** Task object.
*   **Error Responses:**
    *   `404 Not Found`: Task not found.
    *   `403 Forbidden`: If user is not the project owner, assigned user, or an admin.

### 4. Update Task by ID

*   **Endpoint:** `PUT /api/v1/tasks/{task_id}`
*   **Description:** Updates details of a specific task by ID.
*   **Authentication:** Requires `user` (if project owner or assigned to task) or `admin` role.
*   **Request Body (JSON - partial update):**
    ```json
    {
      "title": "Updated Task Title",
      "status": "in-progress",
      "assigned_to_id": 3 # Update assigned user
    }
    ```
*   **Response (200 OK):** Updated task object.
*   **Error Responses:**
    *   `404 Not Found`: Task not found.
    *   `403 Forbidden`: If user is not the project owner, assigned user, or an admin.
    *   `400 Bad Request`: Assigned user not found.

### 5. Delete Task by ID

*   **Endpoint:** `DELETE /api/v1/tasks/{task_id}`
*   **Description:** Deletes a specific task by ID.
*   **Authentication:** Requires `user` (if project owner) or `admin` role. (Assigned users *cannot* delete tasks unless they are also the project owner or admin).
*   **Response (200 OK):** Deleted task object.
*   **Error Responses:**
    *   `404 Not Found`: Task not found.
    *   `403 Forbidden`: If user is not the project owner or an admin.
```