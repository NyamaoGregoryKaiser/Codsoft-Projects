# API Documentation: DB Health Monitor & Optimizer

This document describes the RESTful API endpoints for the DB Health Monitor & Optimizer system.

## Base URL

`http://localhost:5000/api` (for local development)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token:

`Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication Endpoints

### `POST /auth/register`

Register a new user account.

*   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string (email format)",
      "password": "string (min 6 characters)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "number",
          "username": "string",
          "email": "string",
          "role": "string"
        },
        "token": "string (JWT token)"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., invalid email, short password).
    *   `409 Conflict`: Username or email already exists.

### `POST /auth/login`

Authenticate a user and receive a JWT.

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
      "status": "success",
      "data": {
        "user": {
          "id": "number",
          "username": "string",
          "email": "string",
          "role": "string"
        },
        "token": "string (JWT token)"
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing fields).
    *   `401 Unauthorized`: Invalid username or password.

### `GET /auth/profile` (Protected)

Retrieve the profile of the authenticated user.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "number",
        "username": "string",
        "email": "string",
        "role": "string"
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: No token, invalid token, or expired token.

---

## 2. Database Connection Endpoints

All endpoints under `/api/databases` are **protected** and require a valid JWT.

### `POST /databases`

Create a new database connection entry.

*   **Headers:** `Authorization: Bearer <token>`
*   **Request Body:**
    ```json
    {
      "name": "string (unique per user)",
      "type": "string (e.g., 'postgresql', default 'postgresql')",
      "host": "string",
      "port": "number (default 5432)",
      "username": "string",
      "password": "string",
      "database": "string",
      "is_monitoring_active": "boolean (default false)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "number",
        "user_id": "number",
        "name": "string",
        "type": "string",
        "host": "string",
        "port": "number",
        "username": "string",
        "database": "string",
        "is_monitoring_active": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    }
    ```
    *(Note: The `password` field is not returned in the response.)*
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Authentication error.
    *   `409 Conflict`: Connection with the same name already exists for the user.

### `GET /databases`

Retrieve all database connections for the authenticated user.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        { /* Connection Object (same as POST response, without password) */ }
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.

### `GET /databases/:id`

Retrieve a specific database connection by ID.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": { /* Connection Object (same as POST response, without password) */ }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

### `PUT /databases/:id`

Update an existing database connection.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Request Body:** (Partial update, any field can be updated)
    ```json
    {
      "name": "string",
      "host": "string",
      "password": "string",
      "is_monitoring_active": "boolean"
      // ... other fields
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": { /* Updated Connection Object (same as POST response, without password) */ }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed.
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

### `DELETE /databases/:id`

Delete a database connection.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Connection deleted successfully."
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

### `POST /databases/:id/monitor/start`

Start monitoring for a specific database connection. This will add a recurring job to the queue.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "number",
        "name": "string",
        "is_monitoring_active": true,
        "message": "Monitoring started successfully."
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

### `POST /databases/:id/monitor/stop`

Stop monitoring for a specific database connection. This will remove the recurring job from the queue.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "number",
        "name": "string",
        "is_monitoring_active": false,
        "message": "Monitoring stopped successfully."
      }
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

---

## 3. Dashboard Endpoints

All endpoints under `/api/dashboard` are **protected** and require a valid JWT.

### `GET /dashboard/summary`

Retrieve a high-level summary of all monitored databases for the authenticated user. Includes counts, latest metric timestamps, and latest data snapshots for quick overview. This endpoint is cached.

*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "totalConnections": "number",
        "activeMonitoring": "number",
        "databases": [
          {
            "id": "number",
            "name": "string",
            "host": "string",
            "isMonitoringActive": "boolean",
            "lastMonitored": "timestamp | null",
            "latestData": { /* JSON object of latest metrics */ },
            "metricCount": "number"
          }
        ]
      },
      "source": "cache | undefined"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.

### `GET /dashboard/:id/metrics`

Retrieve historical metrics for a specific database connection. This endpoint is cached.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `id`: `number` - The ID of the database connection.
*   **Query Parameters:**
    *   `period`: `string` (Optional, default `24h`) - Time range for metrics. Valid values: `1h`, `24h`, `7d`.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "timestamp": "timestamp",
          "connections": [], // Array of connection states
          "slowQueriesCount": "number",
          "databaseSize": "string", // Formatted size
          // ... other processed metrics for charts
        }
      ],
      "source": "cache | undefined"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Connection not found or not owned by the user.

---

## 4. Recommendation Endpoints

All endpoints under `/api/databases/:dbConnectionId/recommendations` are **protected** and require a valid JWT.

### `GET /databases/:dbConnectionId/recommendations`

Retrieve recommendations for a specific database connection.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `dbConnectionId`: `number` - The ID of the database connection.
*   **Query Parameters:**
    *   `status`: `string` (Optional, default `pending`) - Filter recommendations by status. Valid values: `pending`, `implemented`, `dismissed`, `all`.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "number",
          "db_connection_id": "number",
          "type": "string",        // e.g., 'index_missing', 'slow_query'
          "title": "string",
          "description": "string",
          "sql_suggestion": "string | null",
          "severity": "string",    // 'critical', 'high', 'medium', 'low'
          "status": "string",      // 'pending', 'implemented', 'dismissed'
          "details": {},           // JSON object with specific details
          "generated_at": "timestamp",
          "resolved_at": "timestamp | null"
        }
      ]
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Database connection not found or not owned by the user.

### `PUT /databases/:dbConnectionId/recommendations/:id`

Update the status of a specific recommendation.

*   **Headers:** `Authorization: Bearer <token>`
*   **Path Parameters:**
    *   `dbConnectionId`: `number` - The ID of the database connection.
    *   `id`: `number` - The ID of the recommendation.
*   **Request Body:**
    ```json
    {
      "status": "string" // New status: 'pending', 'implemented', 'dismissed'
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": { /* Updated Recommendation Object (same as GET response) */ }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., invalid status).
    *   `401 Unauthorized`: Authentication error.
    *   `404 Not Found`: Recommendation or database connection not found, or not owned by the user.