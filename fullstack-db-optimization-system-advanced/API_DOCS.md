# 📖 API Documentation: Database Optimization System

This document provides a comprehensive overview of the RESTful API endpoints for the Database Optimization System.

**Base URL**: `http://localhost:5000/api`

## 🔐 Authentication

All protected endpoints require a JSON Web Token (JWT) to be sent in the `Authorization` header as a Bearer token.

**Example Header**:
`Authorization: Bearer <your_jwt_token>`

### Auth Endpoints

#### `POST /api/auth/register`
Registers a new user.
*   **Access**: Public
*   **Rate Limited**: Yes (Specific to auth routes)
*   **Request Body**:
    ```json
    {
      "username": "newuser",
      "password": "strongpassword"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "id": "uuid-string",
        "username": "newuser",
        "role": "user",
        "token": "jwt-token-string"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: "Please enter all fields", "Password must be at least 6 characters long"
    *   `400 Bad Request`: "User already exists"

#### `POST /api/auth/login`
Authenticates a user and returns a JWT token.
*   **Access**: Public
*   **Rate Limited**: Yes (Specific to auth routes)
*   **Request Body**:
    ```json
    {
      "username": "existinguser",
      "password": "userpassword"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Logged in successfully",
      "data": {
        "id": "uuid-string",
        "username": "existinguser",
        "role": "user",
        "token": "jwt-token-string"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: "Please enter all fields"
    *   `401 Unauthorized`: "Invalid credentials"

#### `GET /api/auth/me`
Retrieves the profile of the authenticated user.
*   **Access**: Private (Authenticated User)
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "User profile fetched",
      "data": {
        "id": "uuid-string",
        "username": "authenticateduser",
        "role": "admin"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: "Not authorized, no token", "Not authorized, token failed", "Not authorized, user data not found in request"

## 📊 Query Monitoring Endpoints

All query endpoints are scoped by `dbInstanceId`. For this demo, a default instance ID is used implicitly in the frontend, but in a multi-DB system, this would be dynamic.

#### `GET /api/queries/:dbInstanceId`
Retrieves a paginated list of slow queries for a specific database instance.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
*   **Query Parameters**:
    *   `minDuration` (integer, optional): Minimum query duration in milliseconds.
    *   `startDate` (string, optional): ISO 8601 date string for start of time range.
    *   `endDate` (string, optional): ISO 8601 date string for end of time range.
    *   `queryText` (string, optional): Text to search within query text (case-insensitive).
    *   `page` (integer, optional, default: `1`): Page number for pagination.
    *   `pageSize` (integer, optional, default: `10`): Number of items per page.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Slow queries fetched successfully",
      "data": [
        {
          "id": "uuid-string",
          "dbInstanceId": "uuid-string",
          "queryText": "SELECT * FROM users WHERE status = 'active';",
          "durationMs": 1250,
          "occurredAt": "2023-10-26T10:30:00.000Z",
          "params": null,
          "executionPlanText": "{...}",
          "hash": "query-hash-string",
          "createdAt": "2023-10-26T10:30:00.000Z",
          "updatedAt": "2023-10-26T10:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 50,
        "page": 1,
        "pageSize": 10,
        "totalPages": 5
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found".

#### `GET /api/queries/:dbInstanceId/:queryId`
Retrieves details of a single monitored query, including its execution plans.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
    *   `queryId` (string): The ID of the monitored query.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Slow query details fetched successfully",
      "data": {
        "id": "uuid-string",
        "dbInstanceId": "uuid-string",
        "queryText": "SELECT * FROM users WHERE id = 'some_id';",
        "durationMs": 850,
        "occurredAt": "2023-10-26T10:35:00.000Z",
        "executionPlanText": "{ \"Plan\": { \"Node Type\": \"Index Scan\", ... } }",
        "hash": "query-hash-string",
        "queryExplanation": [
          {
            "id": "uuid-string",
            "monitoredQueryId": "uuid-string",
            "planType": "Index Scan",
            "cost": 15.2,
            "rows": 1,
            "actualTime": 0.8,
            "loops": 1,
            "nodeName": "idx_users_id",
            "detail": { /* full JSON plan details */ },
            "createdAt": "2023-10-26T10:35:01.000Z",
            "updatedAt": "2023-10-26T10:35:01.000Z"
          }
        ]
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found", "Monitored query not found for this instance".

#### `GET /api/queries/:dbInstanceId/:queryId/explanations`
Retrieves all execution plans associated with a specific monitored query.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
    *   `queryId` (string): The ID of the monitored query.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Query explanations fetched successfully",
      "data": [
        {
          "id": "uuid-string",
          "monitoredQueryId": "uuid-string",
          "planType": "Seq Scan",
          "cost": 1500.5,
          "rows": 100000,
          "actualTime": 2.1,
          "loops": 1,
          "nodeName": "users_table",
          "detail": { /* full JSON plan details */ }
        }
      ]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found", "Monitored query not found for this instance".

## 🔑 Index Suggestion Endpoints

#### `GET /api/indexes/:dbInstanceId`
Retrieves a list of index suggestions for a specific database instance.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
*   **Query Parameters**:
    *   `status` (string, optional): Filter by `pending`, `applied`, or `dismissed`.
    *   `tableName` (string, optional): Filter by table name (case-insensitive).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Index suggestions fetched successfully",
      "data": [
        {
          "id": "uuid-string",
          "dbInstanceId": "uuid-string",
          "tableName": "orders",
          "columns": ["customer_id", "order_date"],
          "condition": null,
          "reason": "Frequent filtering on customer_id and order_date.",
          "queryIds": ["uuid-query-1", "uuid-query-2"],
          "status": "pending",
          "createdAt": "2023-10-25T09:00:00.000Z",
          "updatedAt": "2023-10-25T09:00:00.000Z"
        }
      ]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found".

#### `PUT /api/indexes/:dbInstanceId/:suggestionId/status`
Updates the status of an index suggestion.
*   **Access**: Private (Admin User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
    *   `suggestionId` (string): The ID of the index suggestion.
*   **Request Body**:
    ```json
    {
      "status": "applied"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Index suggestion uuid-string status updated to applied",
      "data": {
        "id": "uuid-string",
        "status": "applied",
        // ... other suggestion details
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: "Status field is required", "Invalid status provided."
    *   `401 Unauthorized`: Not authenticated.
    *   `403 Forbidden`: User does not have 'admin' role.
    *   `404 Not Found`: "Database instance not found", "Index suggestion not found".

## 🚧 Schema Analysis Endpoints

#### `GET /api/schemas/:dbInstanceId`
Retrieves a list of schema issues for a specific database instance.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
*   **Query Parameters**:
    *   `status` (string, optional): Filter by `open`, `resolved`, or `ignored`.
    *   `severity` (string, optional): Filter by `low`, `medium`, or `high`.
    *   `issueType` (string, optional): Filter by issue type (e.g., `MissingForeignKey`).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Schema issues fetched successfully",
      "data": [
        {
          "id": "uuid-string",
          "dbInstanceId": "uuid-string",
          "issueType": "MissingForeignKey",
          "description": "Table 'customers' is missing a foreign key constraint on 'address_id'.",
          "objectName": "customers",
          "severity": "high",
          "status": "open",
          "createdAt": "2023-10-24T11:15:00.000Z",
          "updatedAt": "2023-10-24T11:15:00.000Z"
        }
      ]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found".

#### `PUT /api/schemas/:dbInstanceId/:issueId/status`
Updates the status of a schema issue.
*   **Access**: Private (Admin User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
    *   `issueId` (string): The ID of the schema issue.
*   **Request Body**:
    ```json
    {
      "status": "resolved"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Schema issue uuid-string status updated to resolved",
      "data": {
        "id": "uuid-string",
        "status": "resolved",
        // ... other issue details
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: "Status field is required", "Invalid status provided."
    *   `401 Unauthorized`: Not authenticated.
    *   `403 Forbidden`: User does not have 'admin' role.
    *   `404 Not Found`: "Database instance not found", "Schema issue not found".

## 📈 Metric Endpoints

#### `GET /api/metrics/:dbInstanceId/latest`
Retrieves the latest performance metrics snapshot for a database instance.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Latest metrics fetched successfully",
      "data": {
        "id": "uuid-string",
        "dbInstanceId": "uuid-string",
        "timestamp": "2023-10-26T14:00:00.000Z",
        "cpuUsage": 45.7,
        "memoryUsage": 2048.5,
        "ioOperations": 5000,
        "activeConnections": 75,
        "transactionsPerSec": 150.2,
        // ... other metric fields
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found", "No metrics found for this instance".

#### `GET /api/metrics/:dbInstanceId/history`
Retrieves historical performance metrics for a database instance within a specified time range.
*   **Access**: Private (Authenticated User)
*   **Path Parameters**:
    *   `dbInstanceId` (string): The ID of the database instance.
*   **Query Parameters**:
    *   `startDate` (string, required): ISO 8601 date string for the start of the history.
    *   `endDate` (string, optional, default: current time): ISO 8601 date string for the end of the history.
    *   `limit` (integer, optional, default: `100`): Maximum number of metric snapshots to return.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Metric history fetched successfully",
      "data": [
        {
          "id": "uuid-string-1",
          "dbInstanceId": "uuid-string",
          "timestamp": "2023-10-25T13:00:00.000Z",
          "cpuUsage": 30.1,
          "memoryUsage": 1800.0,
          "activeConnections": 60,
          // ...
        },
        {
          "id": "uuid-string-2",
          "dbInstanceId": "uuid-string",
          "timestamp": "2023-10-25T14:00:00.000Z",
          "cpuUsage": 35.5,
          "memoryUsage": 1900.2,
          "activeConnections": 65,
          // ...
        }
      ]
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: "Invalid date format for startDate or endDate".
    *   `401 Unauthorized`: Not authenticated.
    *   `404 Not Found`: "Database instance not found".

## 🩺 Health Check

#### `GET /api/health`
Basic endpoint to check if the API server is running.
*   **Access**: Public
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "ok",
      "uptime": 12345.67
    }
    ```
---