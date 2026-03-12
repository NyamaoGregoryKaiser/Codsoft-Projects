```markdown
# API Documentation: Performance Monitoring System

This document outlines the RESTful API endpoints for the Performance Monitoring System.
All API endpoints are prefixed with `/api`.

**Base URL**: `http://localhost:5000/api` (or `http://your-domain.com/api` in production)

---

## Authentication

Authentication for most user-facing endpoints is done via JSON Web Tokens (JWT).
After `login` or `register`, a `token` will be returned. This token must be included in the `Authorization` header of subsequent requests as `Bearer <token>`.

Example: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Metric ingestion uses an `X-API-Key` header instead of a JWT.

---

## 1. Auth Endpoints

### 1.1. `POST /api/auth/register`

Register a new user account.

*   **Rate Limit**: 10 requests per 5 minutes per IP.
*   **Request Body**:
    ```json
    {
      "username": "john_doe",
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "uuid-of-user",
          "username": "john_doe",
          "email": "john.doe@example.com"
        },
        "token": "jwt-token-string"
      },
      "message": "User registered successfully. Welcome!"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing fields or invalid format.
    *   `409 Conflict`: Username or email already exists.

### 1.2. `POST /api/auth/login`

Authenticate a user and receive a JWT.

*   **Rate Limit**: 10 requests per 5 minutes per IP.
*   **Request Body**:
    ```json
    {
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "uuid-of-user",
          "username": "john_doe",
          "email": "john.doe@example.com"
        },
        "token": "jwt-token-string"
      },
      "message": "Logged in successfully. Welcome back!"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid credentials.

---

## 2. User Endpoints

All endpoints require JWT authentication.

### 2.1. `GET /api/users/me`

Get the profile of the authenticated user.

*   **Authentication**: Required (JWT).
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "uuid-of-user",
        "username": "john_doe",
        "email": "john.doe@example.com",
        "createdAt": "2023-10-27T10:00:00.000Z"
      },
      "message": "User profile retrieved successfully."
    }
    ```

### 2.2. `PATCH /api/users/me`

Update the profile of the authenticated user.

*   **Authentication**: Required (JWT).
*   **Request Body**:
    ```json
    {
      "username": "new_john_doe",
      "email": "new.email@example.com",
      "password": "newstrongpassword"
    }
    ```
    (Fields are optional; only send what needs to be updated).
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "uuid-of-user",
        "username": "new_john_doe",
        "email": "new.email@example.com",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T11:30:00.000Z"
      },
      "message": "User profile updated successfully."
    }
    ```
*   **Error Responses**:
    *   `409 Conflict`: Username or email already in use.

### 2.3. `DELETE /api/users/me`

Delete the authenticated user's account. This action is irreversible and will also delete all associated applications and metrics.

*   **Authentication**: Required (JWT).
*   **Response (204 No Content)**:
    *   Empty response body.
*   **Error Responses**:
    *   `404 Not Found`: User not found (unlikely if authenticated successfully).

---

## 3. Application Endpoints

All endpoints (except metric collection) require JWT authentication and resource ownership authorization.

### 3.1. `POST /api/applications`

Create a new application to monitor.

*   **Authentication**: Required (JWT).
*   **Request Body**:
    ```json
    {
      "name": "My Production WebApp",
      "description": "Monitors the main production web application."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "uuid-of-app",
        "userId": "uuid-of-user",
        "name": "My Production WebApp",
        "description": "Monitors the main production web application.",
        "apiKey": "uuid-for-metric-ingestion",
        "createdAt": "2023-10-27T10:00:00.000Z"
      },
      "message": "Application created successfully."
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing name.
    *   `409 Conflict`: An application with the same name already exists for the user.

### 3.2. `GET /api/applications`

Get all applications owned by the authenticated user.

*   **Authentication**: Required (JWT).
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "app-uuid-1",
          "userId": "user-uuid",
          "name": "My Production WebApp",
          "description": "...",
          "apiKey": "api-key-1",
          "createdAt": "...",
          "updatedAt": "..."
        },
        {
          "id": "app-uuid-2",
          "userId": "user-uuid",
          "name": "Dev Environment API",
          "description": "...",
          "apiKey": "api-key-2",
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "message": "User applications retrieved successfully."
    }
    ```

### 3.3. `GET /api/applications/:appId`

Get a single application by its ID.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "app-uuid-1",
        "userId": "user-uuid",
        "name": "My Production WebApp",
        "description": "Monitors the main production web application.",
        "apiKey": "api-key-1",
        "createdAt": "...",
        "updatedAt": "...",
        "owner": {
          "id": "user-uuid",
          "username": "john_doe",
          "email": "john.doe@example.com"
        }
      },
      "message": "Application retrieved successfully."
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: Application not found.
    *   `403 Forbidden`: User does not own the application.

### 3.4. `PATCH /api/applications/:appId`

Update an existing application.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
*   **Request Body**:
    ```json
    {
      "name": "New Application Name",
      "description": "Updated description for my app."
    }
    ```
    (Fields are optional).
*   **Response (200 OK)**: Returns the updated application object.
*   **Error Responses**:
    *   `404 Not Found`: Application not found.
    *   `403 Forbidden`: User does not own the application.
    *   `409 Conflict`: An application with the new name already exists for the user.

### 3.5. `POST /api/applications/:appId/regenerate-api-key`

Regenerate the API key for an application. The old API key will immediately become invalid.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "apiKey": "new-uuid-for-metric-ingestion"
      },
      "message": "API Key regenerated successfully."
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: Application not found.
    *   `403 Forbidden`: User does not own the application.

### 3.6. `DELETE /api/applications/:appId`

Delete an application. This will also delete all associated metrics and alerts.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
*   **Response (204 No Content)**:
    *   Empty response body.
*   **Error Responses**:
    *   `404 Not Found`: Application not found.
    *   `403 Forbidden`: User does not own the application.

---

## 4. Metric & Alert Endpoints

### 4.1. `POST /api/metrics/collect`

Ingest performance metrics from a client application.

*   **Authentication**: Required (API Key in `X-API-Key` header).
*   **Rate Limit**: 600 requests per minute per IP.
*   **Headers**:
    *   `X-API-Key`: The API key of the monitored application.
*   **Request Body**:
    ```json
    {
      "type": "cpu",         // Required: 'cpu', 'memory', 'request_latency', 'error_rate'
      "value": 0.75,         // Required: Numeric value
      "timestamp": "2023-10-27T10:05:00.000Z" // Optional: defaults to current time if not provided
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "metric-uuid",
        "applicationId": "app-uuid",
        "type": "cpu",
        "value": 0.75,
        "timestamp": "2023-10-27T10:05:00.000Z",
        "createdAt": "...",
        "updatedAt": "..."
      },
      "message": "Metric collected successfully."
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: API Key missing.
    *   `403 Forbidden`: Invalid API Key.
    *   `400 Bad Request`: Missing `type` or `value`, invalid `type`, or non-numeric `value`.
    *   `429 Too Many Requests`: Rate limit exceeded.

### 4.2. `GET /api/metrics/:appId/data/:metricType`

Retrieve historical performance metrics for a specific application and metric type.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
    *   `metricType`: The type of metric (e.g., `cpu`, `memory`, `request_latency`, `error_rate`).
*   **Query Parameters**:
    *   `period`: (Optional) Time period for the metrics. Default: `24h`.
        *   Allowed values: `1h`, `24h`, `7d`, `30d`.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        { "value": 0.5, "timestamp": "2023-10-27T08:00:00.000Z" },
        { "value": 0.55, "timestamp": "2023-10-27T08:30:00.000Z" },
        // ... more data points
        { "value": 0.6, "timestamp": "2023-10-27T10:00:00.000Z" }
      ],
      "message": "Metrics for cpu retrieved successfully."
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: Application not found.
    *   `403 Forbidden`: User does not own the application.
    *   `400 Bad Request`: Invalid `metricType` or `period`.

### 4.3. `GET /api/metrics/:appId/alerts`

Get all alerts configured for a specific application.

*   **Authentication**: Required (JWT).
*   **Authorization**: User must own the application.
*   **Path Parameters**:
    *   `appId`: The UUID of the application.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [