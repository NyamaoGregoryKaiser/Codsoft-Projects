```markdown
# API Documentation: Database Performance Monitor & Optimizer

This document provides a comprehensive overview of the RESTful API endpoints for the Database Performance Monitor & Optimizer application.

**Base URL:** `http://localhost:5000/api`

## Authentication

All protected endpoints require a valid JWT token passed in the `Authorization` header as `Bearer <token>`.

### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

*   **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "token": "jwt_token_string",
      "user": {
        "id": "uuid",
        "username": "string",
        "role": "admin" | "user"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing fields).
    *   `401 Unauthorized`: Invalid credentials.

## User Management

### `POST /api/users/register`

Registers a new user account.

*   **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string",
      "role": "admin" | "user" (optional, defaults to "user")
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "id": "uuid",
        "username": "string",
        "role": "admin" | "user"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `409 Conflict`: User with this username already exists.

### `GET /api/users/profile` (Protected)

Retrieves the profile of the authenticated user.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "username": "string",
        "role": "admin" | "user",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: User not found (should not happen with a valid token).

### `GET /api/users` (Protected, Admin Only)

Retrieves a list of all registered users.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "username": "string",
          "role": "admin" | "user",
          "createdAt": "datetime"
        },
        // ... more users
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing token.
    *   `403 Forbidden`: User does not have 'admin' role.

## Database Connection Management

All endpoints require authentication (`Authorization` header).

### `POST /api/connections` (Protected)

Creates a new database connection profile.

*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "name": "string",
      "host": "string",
      "port": number,
      "dbName": "string",
      "dbUser": "string",
      "dbPassword": "string"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "Database connection created",
      "data": {
        "id": "uuid",
        "name": "string",
        "host": "string",
        "port": number,
        "dbName": "string",
        "dbUser": "string"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `409 Conflict`: Connection with this name already exists for the user.

### `GET /api/connections` (Protected)

Retrieves all database connection profiles for the authenticated user.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "host": "string",
          "port": number,
          "dbName": "string",
          "dbUser": "string"
        },
        // ... more connections
      ]
    }
    ```

### `GET /api/connections/:id` (Protected)

Retrieves a single database connection profile by ID.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `id` (UUID of the connection)
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "name": "string",
        "host": "string",
        "port": number,
        "dbName": "string",
        "dbUser": "string"
      }
    }
    ```
    *Note: `dbPassword` is intentionally omitted from the response for security.*
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format for `id`.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized for the user.

### `PUT /api/connections/:id` (Protected)

Updates an existing database connection profile.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `id` (UUID of the connection)
*   **Request Body (partial update):**
    ```json
    {
      "name"?: "string",
      "host"?: "string",
      "port"?: number,
      "dbName"?: "string",
      "dbUser"?: "string",
      "dbPassword"?: "string" // Provide only if changing password
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Connection updated successfully",
      "data": {
        "id": "uuid",
        "name": "string",
        "host": "string",
        "port": number,
        "dbName": "string",
        "dbUser": "string"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed or invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.

### `DELETE /api/connections/:id` (Protected)

Deletes a database connection profile.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `id` (UUID of the connection)
*   **Response (204 No Content):**
    ```json
    {
      "success": true,
      "message": "Connection deleted successfully"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.

## Database Monitoring & Optimization

All endpoints require authentication (`Authorization` header).

### `GET /api/monitor/:connectionId/active-queries` (Protected)

Retrieves a list of currently active queries for the specified external database.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Query Params:**
    *   `minDurationMs`: `number` (optional) - Only return queries running longer than this duration in milliseconds. Defaults to 0.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "pid": number,
          "application_name": "string",
          "datname": "string",
          "usename": "string",
          "client_addr": "string",
          "client_port": number,
          "backend_start": "datetime",
          "xact_start": "datetime",
          "query_start": "datetime",
          "state_change": "datetime",
          "state": "string", // e.g., "active", "idle"
          "wait_event_type": "string | null",
          "wait_event": "string | null",
          "query": "string",
          "backend_type": "string",
          "duration_ms": number // Calculated duration in milliseconds
        },
        // ... more queries
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format for `connectionId`.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or query the target database.

### `GET /api/monitor/:connectionId/slow-queries` (Protected)

Retrieves a list of queries considered "slow" (currently active and exceeding a duration threshold) for the specified external database. This is a specialized view of active queries.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Query Params:**
    *   `thresholdMs`: `number` (optional) - Only return queries running longer than this duration in milliseconds. Defaults to 1000ms (1 second).
*   **Response (200 OK):** (Same structure as `active-queries`)
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or query the target database.

### `POST /api/monitor/:connectionId/analyze-query` (Protected)

Executes an `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON)` command for a given SQL query on the specified external database. Only `SELECT` queries are permitted.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Request Body:**
    ```json
    {
      "query": "string" // The SQL SELECT query to analyze
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": "string" // JSON string representation of the EXPLAIN ANALYZE output
    }
    ```
    Example `data`:
    ```json
    [
      {
        "Plan": {
          "Node Type": "Seq Scan",
          "Parallel Aware": false,
          "Relation Name": "users",
          "Alias": "users",
          "Startup Cost": 0.00,
          "Total Cost": 14.50,
          "Plan Rows": 450,
          "Plan Width": 36,
          "Actual Startup Time": 0.015,
          "Actual Total Time": 0.038,
          "Actual Rows": 2,
          "Actual Loops": 1,
          "Buffers": {
            "Shared hit": 1
          }
        }
      }
    ]
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format, or query is not a `SELECT` statement, or contains DML/DDL.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or execute query on the target database.

### `GET /api/monitor/:connectionId/indexes` (Protected)

Retrieves a list of all indexes for tables owned by the user (public schema) in the specified external database, along with their usage statistics.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "schemaname": "string",
          "relname": "string", // Table name
          "indexrelname": "string", // Index name
          "idx_scan": "string", // Number of index scans
          "idx_tup_read": "string", // Number of tuples read from index
          "idx_tup_fetch": "string", // Number of tuples fetched from table via index
          "indexdef": "string" // The CREATE INDEX statement
        },
        // ... more indexes
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or query the target database.

### `POST /api/monitor/:connectionId/indexes` (Protected)

Creates a new B-tree index on the specified table and columns in the external database.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Request Body:**
    ```json
    {
      "tableName": "string",
      "columns": ["string"], // Array of column names
      "indexName"?: "string", // Optional, if not provided, one will be generated
      "unique"?: boolean    // Optional, defaults to false. If true, creates a UNIQUE index.
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "string" // Confirmation message
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing table/columns), or invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or execute index creation on the target database (e.g., syntax error, table/column not found).

### `DELETE /api/monitor/:connectionId/indexes` (Protected)

Drops an index from the specified external database.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Request Body:**
    ```json
    {
      "indexName": "string" // The name of the index to drop
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "string" // Confirmation message
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing index name), or invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or execute index drop on the target database (e.g., index not found).

### `GET /api/monitor/:connectionId/schema` (Protected)

Retrieves schema information (tables and their columns) for the specified external database.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Params:** `connectionId` (UUID of the database connection)
*   **Query Params:**
    *   `tableName`: `string` (optional) - If provided, returns schema for a specific table. Otherwise, returns schema for all public tables.
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "tableName": "string",
          "columns": [
            {
              "columnName": "string",
              "dataType": "string",
              "isNullable": boolean,
              "defaultValue": "string | null",
              "isPrimary": boolean
            },
            // ... more columns
          ]
        },
        // ... more tables
      ]
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid UUID format.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Connection not found or unauthorized.
    *   `500 Internal Server Error`: Failed to connect to or query the target database.

---
```