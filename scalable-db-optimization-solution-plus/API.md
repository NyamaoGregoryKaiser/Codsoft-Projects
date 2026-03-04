```markdown
# OptiDB API Documentation

This document describes the RESTful API endpoints for the OptiDB Database Optimization System.

**Base URL:** `http://localhost:18080` (or as configured)

---

## Authentication

All protected routes require a JSON Web Token (JWT) in the `Authorization` header, formatted as `Bearer <token>`.

### 1. Register User
Registers a new user account with OptiDB.

-   **Endpoint:** `POST /auth/register`
-   **Request Body (JSON):**
    ```json
    {
        "username": "newuser",
        "email": "user@example.com",
        "password": "strongpassword123"
    }
    ```
-   **Success Response (201 Created):**
    ```json
    {
        "id": 1,
        "username": "newuser",
        "email": "user@example.com",
        "created_at": "2023-10-27T10:00:00Z",
        "updated_at": "2023-10-27T10:00:00Z"
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request`: Missing fields or invalid input.
    -   `409 Conflict`: Username or email already exists.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 2. Login User
Authenticates a user and returns a JWT token.

-   **Endpoint:** `POST /auth/login`
-   **Request Body (JSON):**
    ```json
    {
        "username": "newuser",
        "password": "strongpassword123"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request`: Missing username or password.
    -   `401 Unauthorized`: Invalid username or password.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

---

## Target Database Management

These endpoints allow users to manage the PostgreSQL databases that OptiDB will monitor and optimize.

### 3. Get All Target Databases
Retrieves a list of all target databases registered by the authenticated user.

-   **Endpoint:** `GET /targets`
-   **Authentication:** Required
-   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 101,
            "user_id": 1,
            "name": "Production DB",
            "host": "prod-db.example.com",
            "port": "5432",
            "db_name": "mydb",
            "db_user": "app_user",
            "status": "ACTIVE",
            "last_error": null,
            "created_at": "2023-10-27T10:30:00Z",
            "updated_at": "2023-10-27T10:30:00Z"
        },
        {
            "id": 102,
            "user_id": 1,
            "name": "Staging DB",
            "host": "stg-db.example.com",
            "port": "5432",
            "db_name": "stg_mydb",
            "db_user": "stg_user",
            "status": "ERROR",
            "last_error": "Connection refused.",
            "created_at": "2023-10-27T11:00:00Z",
            "updated_at": "2023-10-27T11:00:00Z"
        }
    ]
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Missing or invalid token.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 4. Register New Target Database
Adds a new PostgreSQL database to OptiDB for monitoring.

-   **Endpoint:** `POST /targets`
-   **Authentication:** Required
-   **Request Body (JSON):**
    ```json
    {
        "name": "New Prod DB",
        "host": "prod-db-new.example.com",
        "port": "5432",
        "db_name": "prod_data",
        "db_user": "prod_user",
        "db_password": "prod_db_secret"
    }
    ```
-   **Success Response (201 Created):** (Includes initial connection test status)
    ```json
    {
        "id": 103,
        "user_id": 1,
        "name": "New Prod DB",
        "host": "prod-db-new.example.com",
        "port": "5432",
        "db_name": "prod_data",
        "db_user": "prod_user",
        "status": "ACTIVE",
        "last_error": null,
        "created_at": "2023-10-27T12:00:00Z",
        "updated_at": "2023-10-27T12:00:00Z"
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request`: Missing required fields.
    -   `401 Unauthorized`: Invalid token.
    -   `409 Conflict`: A target database with this name already exists for the user.
    -   `502 Bad Gateway`: Could not establish an initial connection to the target database.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 5. Get Target Database by ID
Retrieves details for a specific target database.

-   **Endpoint:** `GET /targets/{id}`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database.
-   **Success Response (200 OK):**
    ```json
    {
        "id": 101,
        "user_id": 1,
        "name": "Production DB",
        "host": "prod-db.example.com",
        "port": "5432",
        "db_name": "mydb",
        "db_user": "app_user",
        "status": "ACTIVE",
        "last_error": null,
        "created_at": "2023-10-27T10:30:00Z",
        "updated_at": "2023-10-27T10:30:00Z"
    }
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 6. Update Target Database
Updates the details of an existing target database.

-   **Endpoint:** `PUT /targets/{id}`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database to update.
-   **Request Body (JSON):** (All fields are required for update to avoid partial updates)
    ```json
    {
        "name": "Updated Prod DB Name",
        "host": "prod-db-new.example.com",
        "port": "5432",
        "db_name": "prod_data",
        "db_user": "prod_user",
        "db_password": "updated_prod_db_secret",
        "status": "ACTIVE",
        "last_error": null
    }
    ```
-   **Success Response (200 OK):** (Returns the updated target database object)
    ```json
    {
        "id": 103,
        "user_id": 1,
        "name": "Updated Prod DB Name",
        "host": "prod-db-new.example.com",
        "port": "5432",
        "db_name": "prod_data",
        "db_user": "prod_user",
        "status": "ACTIVE",
        "last_error": null,
        "created_at": "2023-10-27T12:00:00Z",
        "updated_at": "2023-10-27T13:00:00Z"
    }
    ```
-   **Error Responses:**
    -   `400 Bad Request`: Missing required fields.
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 7. Delete Target Database
Removes a target database from OptiDB.

-   **Endpoint:** `DELETE /targets/{id}`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database to delete.
-   **Success Response (204 No Content):** (No body content on successful deletion)
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

---

## Target Database Operations

These endpoints provide functionality to interact with and analyze the registered target databases.

### 8. Test Target Database Connection
Tests the connection to a specified target database.

-   **Endpoint:** `GET /targets/{id}/test-connection`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database.
-   **Success Response (200 OK):**
    ```json
    {
        "message": "Connection successful."
    }
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `502 Bad Gateway`: Could not connect to the target database.
    -   `500 Internal Server Error`: Unexpected server issue.

### 9. Analyze Target Database
Triggers a performance analysis for the specified target database. This operation collects metrics, analyzes slow queries, and generates new recommendations.

-   **Endpoint:** `POST /targets/{id}/analyze`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database to analyze.
-   **Success Response (200 OK):**
    ```json
    {
        "message": "Analysis completed. New recommendations generated and stored.",
        "recommendations": [
            {
                "id": 201,
                "target_db_id": 101,
                "query_metric_id": 305,
                "type": "INDEX_SUGGESTION",
                "description": "Consider adding an index on table 'users' column 'email'",
                "suggestion_sql": "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);",
                "rationale": "Query 'SELECT * FROM users WHERE email = ...' is performing slowly...",
                "estimated_impact_score": 85.5,
                "applied": false,
                "created_at": "2023-10-27T14:00:00Z",
                "updated_at": "2023-10-27T14:00:00Z"
            }
        ]
    }
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `502 Bad Gateway`: Could not connect to the target database or required extensions (e.g., `pg_stat_statements`) are missing.
    -   `500 Internal Server Error`: Database error or unexpected server issue during analysis.

### 10. Get Historical Query Metrics
Retrieves collected performance metrics for queries run on a specific target database.

-   **Endpoint:** `GET /targets/{id}/metrics`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database.
-   **Query Parameters:**
    -   `limit` (integer, optional): Maximum number of metrics to retrieve (default: 100).
-   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 305,
            "target_db_id": 101,
            "query_text": "SELECT * FROM users WHERE email = $1;",
            "total_time_ms": 1500.25,
            "calls": 100,
            "mean_time_ms": 15.00,
            "stddev_time_ms": 2.5,
            "rows": 100,
            "query_plan": "[{\"Plan\": {\"Node Type\": \"Seq Scan\"...}}]",
            "created_at": "2023-10-27T13:45:00Z",
            "updated_at": "2023-10-27T13:45:00Z"
        },
        {
            "id": 306,
            "target_db_id": 101,
            "query_text": "INSERT INTO logs (message) VALUES ($1);",
            "total_time_ms": 50.1,
            "calls": 500,
            "mean_time_ms": 0.1,
            "stddev_time_ms": 0.05,
            "rows": 0,
            "query_plan": "N/A",
            "created_at": "2023-10-27T13:50:00Z",
            "updated_at": "2023-10-27T13:50:00Z"
        }
    ]
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `500 Internal Server Error`: Database error or unexpected server issue.

### 11. Get Optimization Recommendations
Retrieves optimization recommendations generated for a specific target database.

-   **Endpoint:** `GET /targets/{id}/recommendations`
-   **Authentication:** Required
-   **Path Parameters:**
    -   `id` (integer): The ID of the target database.
-   **Query Parameters:**
    -   `include_applied` (boolean, optional): If `true`, includes recommendations that have already been marked as `applied` (default: `false`).
-   **Success Response (200 OK):**
    ```json
    [
        {
            "id": 201,
            "target_db_id": 101,
            "query_metric_id": 305,
            "type": "INDEX_SUGGESTION",
            "description": "Consider adding an index on table 'users' column 'email'",
            "suggestion_sql": "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);",
            "rationale": "Query 'SELECT * FROM users WHERE email = ...' is performing slowly (mean_time: 15.00ms, calls: 100). An index can significantly speed up lookups and ordering.",
            "estimated_impact_score": 85.5,
            "applied": false,
            "created_at": "2023-10-27T14:00:00Z",
            "updated_at": "2023-10-27T14:00:00Z"
        }
    ]
    ```
-   **Error Responses:**
    -   `401 Unauthorized`: Invalid token.
    -   `404 Not Found`: Target database not found or user does not have access.
    -   `500 Internal Server Error`: Database error or unexpected server issue.
```