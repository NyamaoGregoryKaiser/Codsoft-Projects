```markdown
# Performance Monitoring System API Documentation

This document describes the RESTful API endpoints for the Performance Monitoring System.

## Base URL

`http://localhost:5000/api/v1` (adjust for production deployments)

## Authentication

There are two primary authentication methods:

1.  **JWT Token (for User-facing Endpoints):**
    *   Used for user registration, login, project management, alert management, and querying metrics/alerts.
    *   Obtained after successful login (`POST /auth/login`).
    *   Sent in the `Authorization` header as `Bearer <JWT_TOKEN>`.
    *   Example: `Authorization: Bearer eyJhbGc...`

2.  **API Key (for Metric Ingestion):**
    *   Used by monitored applications to securely send performance metrics.
    *   Generated when a project is created or regenerated.
    *   Sent in the `X-API-Key` header.
    *   Example: `X-API-Key: a1b2c3d4-e5f6-7890-1234-567890abcdef`

## Error Responses

All error responses follow a consistent JSON format:

```json
{
  "code": 400,
  "message": "Validation Error: email is required",
  "stack": "..." // Only in development mode
}
```

Common status codes:
*   `400 Bad Request`: Invalid input (e.g., validation failed).
*   `401 Unauthorized`: Authentication failed (missing/invalid token or API key).
*   `403 Forbidden`: Authenticated, but not authorized to perform the action.
*   `404 Not Found`: Resource not found.
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Server-side error.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /auth/register`

Register a new user account.

*   **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123",
      "firstName": "John",
      "lastName": "Doe"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      },
      "tokens": {
        "accessToken": "jwt_token_string",
        "expiresIn": 1800 // seconds
      }
    }
    ```

### `POST /auth/login`

Authenticate a user and get an access token.

*   **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      },
      "tokens": {
        "accessToken": "jwt_token_string",
        "expiresIn": 1800 // seconds
      }
    }
    ```

### `POST /auth/logout`

Log out the current user (destroys session on backend). Requires a valid session cookie.

*   **Response (204 No Content):** Empty response.

### `GET /auth/me`

Get information about the currently authenticated user. Requires JWT.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Response (200 OK):**
    ```json
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```

---

## 2. Project Endpoints (`/projects`)

All project endpoints (except public ones, if any) require JWT authentication.

### `POST /projects`

Create a new monitoring project.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Body:**
    ```json
    {
      "name": "My Web Application",
      "description": "Monitors the performance of my main web app."
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "uuid",
      "name": "My Web Application",
      "description": "Monitors the performance of my main web app.",
      "user_id": "owner_uuid",
      "api_key": "generated_uuid_api_key",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```

### `GET /projects`

Get all projects owned by the authenticated user.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "uuid",
        "name": "My Web Application",
        "description": "Monitors the performance of my main web app.",
        "user_id": "owner_uuid",
        "api_key": "generated_uuid_api_key",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```

### `GET /projects/:projectId`

Get a specific project by ID.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Response (200 OK):** Same as single project object in `GET /projects` response.

### `PATCH /projects/:projectId`

Update an existing project.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Body:** (partial update)
    ```json
    {
      "name": "Updated Project Name",
      "description": "New description for the project."
    }
    ```
*   **Response (200 OK):** Updated project object.

### `DELETE /projects/:projectId`

Delete a project. This will also cascade delete all associated metrics, alerts, and incidents.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Response (204 No Content):** Empty response.

### `POST /projects/:projectId/generate-api-key`

Generate a new API Key for a project. The old API key will be invalidated.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Response (200 OK):** Updated project object with the new API key.

---

## 3. Metric Endpoints (`/metrics`)

### `POST /metrics/ingest`

**Ingest performance metric data from a monitored application.**

*   **Headers:** `X-API-Key: <PROJECT_API_KEY>`
*   **Body:**
    ```json
    {
      "metricType": "http_request",
      "timestamp": "2023-10-27T10:30:00.000Z",
      "data": {
        "url": "/api/users",
        "method": "GET",
        "durationMs": 150.75,
        "status": 200,
        "resourceType": "backend_call"
      }
    }
    ```
    *   `metricType` (string, required): e.g., `http_request`, `resource_usage`, `error`, `custom_event`.
    *   `timestamp` (string, ISO 8601, required): When the metric occurred.
    *   `data` (object, required): JSON object containing the specific payload for the metric type. This is flexible.
*   **Response (201 Created):**
    ```json
    {
      "message": "Metric ingested successfully",
      "metricId": "uuid_of_ingested_metric"
    }
    ```

### `GET /metrics/:projectId`

Get raw performance metrics for a specific project. Requires JWT.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Query Parameters:**
    *   `metricType` (string, optional): Filter by metric type (e.g., `http_request`).
    *   `startTime` (string, ISO 8601, required): Start of the time range.
    *   `endTime` (string, ISO 8601, required): End of the time range.
    *   `limit` (number, optional, default: 100): Maximum number of metrics to return.
    *   `offset` (number, optional, default: 0): Offset for pagination.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "uuid",
        "project_id": "project_uuid",
        "metric_type": "http_request",
        "timestamp": "2023-10-27T10:29:50.000Z",
        "data": { ... } // Original metric data
      }
    ]
    ```

### `GET /metrics/:projectId/aggregated`

Get aggregated performance metrics for a specific project over a time interval. Requires JWT.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Query Parameters:**
    *   `metricType` (string, required): The type of metric to aggregate.
    *   `field` (string, required): The JSONB field within `data` to aggregate (e.g., `durationMs`, `status`).
    *   `aggregationType` (string, required): Type of aggregation (`avg`, `sum`, `count`, `max`, `min`).
    *   `startTime` (string, ISO 8601, required): Start of the time range.
    *   `endTime` (string, ISO 8601, required): End of the time range.
    *   `interval` (string, optional, default: `hour`): Time granularity (`minute`, `5 minutes`, `10 minutes`, `15 minutes`, `30 minutes`, `hour`, `day`, `week`, `month`, `year`).
*   **Response (200 OK):**
    ```json
    [
      {
        "interval_start": "2023-10-27T10:00:00.000Z",
        "value": 250.5 // Aggregated value (e.g., average duration)
      },
      {
        "interval_start": "2023-10-27T11:00:00.000Z",
        "value": 180.2
      }
    ]
    ```

---

## 4. Alert Endpoints (`/projects/:projectId/alerts`)

All alert endpoints require JWT authentication and that the user owns the specified project.

### `POST /projects/:projectId/alerts`

Create a new alert definition for a project.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Body:**
    ```json
    {
      "name": "High HTTP Latency",
      "metricType": "http_request",
      "aggregationType": "avg",
      "field": "durationMs",
      "operator": ">",
      "threshold": 500,
      "timeWindowMinutes": 5,
      "isEnabled": true
    }
    ```
    *   `name` (string, required): Name of the alert.
    *   `metricType` (string, required): Metric type to monitor.
    *   `aggregationType` (string, required): Aggregation for the metric (`avg`, `sum`, `count`, `max`, `min`).
    *   `field` (string, required): JSONB field to aggregate.
    *   `operator` (string, required): Comparison operator (`>`, `<`, `=`).
    *   `threshold` (number, required): Value to compare against.
    *   `timeWindowMinutes` (number, required): Duration (in minutes) over which to aggregate.
    *   `isEnabled` (boolean, optional, default: true): Whether the alert is active.
*   **Response (201 Created):**
    ```json
    {
      "id": "uuid",
      "project_id": "project_uuid",
      "name": "High HTTP Latency",
      "metric_type": "http_request",
      "aggregation_type": "avg",
      "field": "durationMs",
      "operator": ">",
      "threshold": 500,
      "time_window_minutes": 5,
      "is_enabled": true,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```

### `GET /projects/:projectId/alerts`

Get all alert definitions for a project.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Response (200 OK):** Array of alert objects.

### `GET /projects/:projectId/alerts/:alertId`

Get a specific alert definition by ID.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
    *   `alertId` (string, path): The ID of the alert definition.
*   **Response (200 OK):** Single alert object.

### `PATCH /projects/:projectId/alerts/:alertId`

Update an alert definition.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
    *   `alertId` (string, path): The ID of the alert definition.
*   **Body:** (partial update)
    ```json
    {
      "threshold": 600,
      "isEnabled": false
    }
    ```
*   **Response (200 OK):** Updated alert object.

### `DELETE /projects/:projectId/alerts/:alertId`

Delete an alert definition.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
    *   `alertId` (string, path): The ID of the alert definition.
*   **Response (204 No Content):** Empty response.

---

## 5. Alert Incident Endpoints (`/projects/:projectId/incidents`)

These endpoints manage triggered alerts. They are typically accessed by the dashboard or an operational team.

### `GET /projects/:projectId/incidents`

Get alert incidents for a project.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
*   **Query Parameters:**
    *   `status` (string, optional): Filter by incident status (`triggered`, `resolved`, `acknowledged`).
    *   `limit` (number, optional, default: 100)
    *   `offset` (number, optional, default: 0)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "uuid",
        "alert_id": "alert_definition_uuid",
        "project_id": "project_uuid",
        "status": "triggered",
        "triggered_value": { "value": 750 },
        "triggered_at": "timestamp",
        "resolved_at": null,
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```

### `PATCH /projects/:projectId/incidents/:incidentId/status`

Update the status of an alert incident.

*   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
*   **Parameters:**
    *   `projectId` (string, path): The ID of the project.
    *   `incidentId` (string, path): The ID of the alert incident.
*   **Body:**
    ```json
    {
      "status": "resolved"
    }
    ```
    *   `status` (string, required): New status (`resolved`, `acknowledged`).
*   **Response (200 OK):** Updated alert incident object.
```