# AppInsight API Documentation

Base URL: `http://localhost:5000/api` (or your configured backend URL)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header:

`Authorization: Bearer <YOUR_JWT_TOKEN>`

Metric ingestion endpoints require an API Key in a custom header:

`X-AppInsight-Api-Key: <YOUR_PROJECT_API_KEY>`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`

Register a new user account.

*   **Rate Limited:** Yes
*   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "strongpassword123",
      "passwordConfirm": "strongpassword123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "User registered successfully. Please login.",
      "data": {
        "id": "uuid-of-new-user",
        "email": "john.doe@example.com"
      }
    }
    ```
*   **Error Responses (400 Bad Request):**
    *   `"Name must be at least 3 characters long"`
    *   `"Invalid email address"`
    *   `"Password must be at least 8 characters long"`
    *   `"Passwords do not match"`
    *   `"Duplicate field value: email. Please use another value."` (if email already exists)

### `POST /api/auth/login`

Authenticate user and get a JWT token.

*   **Rate Limited:** Yes
*   **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "data": {
        "user": {
          "id": "uuid-of-user",
          "name": "John Doe",
          "email": "john.doe@example.com"
        }
      }
    }
    ```
*   **Error Responses (401 Unauthorized):**
    *   `"Incorrect email or password"`

---

## 2. Project Management Endpoints (`/api/projects`)

All endpoints under `/api/projects` require **JWT Authentication**.
Project-specific endpoints (`/:projectId`) also require the authenticated user to be the **owner** of the project.

### `POST /api/projects`

Create a new project.

*   **Authentication:** JWT
*   **Request Body:**
    ```json
    {
      "name": "My New Web Application"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "project": {
          "id": "uuid-of-project",
          "name": "My New Web Application",
          "apikey": "generated-api-key-string",
          "ownerId": "uuid-of-owner",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:00:00.000Z"
        }
      }
    }
    ```
*   **Error Responses (400 Bad Request):**
    *   `"Project name must be at least 3 characters long"`
    *   (401 Unauthorized if JWT is missing/invalid)

### `GET /api/projects`

Get all projects owned by the authenticated user.

*   **Authentication:** JWT
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "results": 2,
      "data": {
        "projects": [
          {
            "id": "uuid-of-project-1",
            "name": "Project Alpha",
            "apikey": "api-key-alpha",
            "ownerId": "uuid-of-owner",
            "createdAt": "2023-10-26T09:00:00.000Z",
            "updatedAt": "2023-10-26T09:00:00.000Z"
          },
          {
            "id": "uuid-of-project-2",
            "name": "Project Beta",
            "apikey": "api-key-beta",
            "ownerId": "uuid-of-owner",
            "createdAt": "2023-10-25T14:30:00.000Z",
            "updatedAt": "2023-10-25T14:30:00.000Z"
          }
        ]
      }
    }
    ```

### `GET /api/projects/:projectId`

Get a specific project by ID.

*   **Authentication:** JWT + Project Ownership
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "project": {
          "id": "uuid-of-project",
          "name": "My New Web Application",
          "apikey": "generated-api-key-string",
          "ownerId": "uuid-of-owner",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:00:00.000Z"
        }
      }
    }
    ```
*   **Error Responses:**
    *   (404 Not Found if project does not exist)
    *   (403 Forbidden if user is not the owner)

### `PUT /api/projects/:projectId`

Update a project's details (e.g., name).

*   **Authentication:** JWT + Project Ownership
*   **Request Body:**
    ```json
    {
      "name": "Updated Project Name"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "project": {
          "id": "uuid-of-project",
          "name": "Updated Project Name",
          "apikey": "generated-api-key-string",
          "ownerId": "uuid-of-owner",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:30:00.000Z"
        }
      }
    }
    ```
*   **Error Responses:** (Same as GET `/:projectId`)

### `DELETE /api/projects/:projectId`

Delete a project and all its associated metrics.

*   **Authentication:** JWT + Project Ownership
*   **Response (204 No Content):**
    (Empty response body)
*   **Error Responses:** (Same as GET `/:projectId`)

---

## 3. Metric Endpoints (`/api/metrics`)

### `POST /api/metrics/ingest`

Ingest performance metrics from a monitored application.

*   **Authentication:** API Key (`X-AppInsight-Api-Key` header)
*   **Rate Limited:** Yes
*   **Request Body:**
    ```json
    {
      "metrics": [
        {
          "type": "LCP",
          "value": 1500.5,
          "timestamp": "2023-10-27T10:00:00.000Z",
          "context": {
            "url": "/home",
            "element": "hero-image",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/118.0.0.0 Safari/537.36"
          }
        },
        {
          "type": "ERROR",
          "value": 1,
          "timestamp": "2023-10-27T10:00:05.000Z",
          "context": {
            "message": "Uncaught TypeError: Cannot read properties of undefined",
            "url": "/dashboard",
            "component": "MetricChart",
            "stack": "at Module.eval (webpack://...)"
          }
        },
        {
          "type": "API_RESPONSE",
          "value": 250.75,
          "timestamp": "2023-10-27T10:00:10.000Z",
          "context": {
            "endpoint": "/api/users/profile",
            "method": "GET",
            "statusCode": 200
          }
        }
      ]
    }
    ```
    *   `type`: Must be one of `LCP`, `FID`, `CLS`, `API_RESPONSE`, `ERROR`, `CUSTOM`.
    *   `value`: Numeric value of the metric. (e.g., milliseconds for LCP/FID, 1 for errors)
    *   `timestamp`: ISO 8601 formatted date string.
    *   `context`: (Optional) JSON object for additional, flexible data.
*   **Response (202 Accepted):**
    ```json
    {
      "status": "success",
      "message": "Metrics accepted for processing"
    }
    ```
*   **Error Responses (401 Unauthorized):**
    *   `"API Key is required to submit metrics."`
    *   `"Invalid API Key."`
    *   (400 Bad Request for invalid metric data, e.g., wrong `type` enum value)
    *   (429 Too Many Requests if rate limit exceeded)

### `GET /api/metrics/:projectId/summary`

Get a summary of key metrics for a project over a specified period.

*   **Authentication:** JWT + Project Ownership
*   **Query Parameters:**
    *   `period`: (Optional, default `1d`) The time range for aggregation.
        *   Allowed values: `1h`, `6h`, `12h`, `1d`, `7d`, `30d`.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "LCP": { "avg": 1250.5, "min": 1000, "max": 1500, "count": 100 },
        "FID": { "avg": 45.2, "min": 10, "max": 120, "count": 150 },
        "CLS": { "avg": 0.08, "min": 0, "max": 0.2, "count": 80 },
        "totalErrors": 5
      }
    }
    ```

### `GET /api/metrics/:projectId/timeline`

Get time-series data for a specific metric type for a project.

*   **Authentication:** JWT + Project Ownership
*   **Query Parameters:**
    *   `metricType`: (Required) The type of metric to retrieve.
        *   Allowed values: `LCP`, `FID`, `CLS`, `API_RESPONSE`, `ERROR`, `CUSTOM`.
    *   `period`: (Optional, default `1d`) The time range for data.
        *   Allowed values: `1h`, `6h`, `12h`, `1d`, `7d`, `30d`.
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        { "timestamp": "2023-10-27T08:00:00.000Z", "value": 1100 },
        { "timestamp": "2023-10-27T09:00:00.000Z", "value": 1250 },
        { "timestamp": "2023-10-27T10:00:00.000Z", "value": 1300 }
        // ... more data points, typically aggregated hourly or by minute
      ]
    }
    ```
*   **Error Responses (400 Bad Request):**
    *   `"Invalid enum value"` for `metricType` or `period`.
    *   `"Required"` for `metricType` if not provided.

### `GET /api/metrics/:projectId/errors`

Get a list of recent error metrics for a project.

*   **Authentication:** JWT + Project Ownership
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "error-uuid-1",
          "timestamp": "2023-10-27T10:35:12.000Z",
          "context": {
            "message": "ReferenceError: foo is not defined",
            "url": "/settings",
            "stack": "at eval (webpack://...) at HTMLButtonElement.dispatch (jquery.js:5233:27)"
          }
        },
        {
          "id": "error-uuid-2",
          "timestamp": "2023-10-27T10:30:01.000Z",
          "context": {
            "message": "Failed to fetch: Network Error",
            "url": "/api/data",
            "method": "GET",
            "requestBody": null
          }
        }
      ]
    }
    ```

---

## 4. Health Check Endpoint (`/api/health`)

### `GET /api/health`

Checks the health of the application, including database and Redis connections.

*   **Authentication:** None
*   **Response (200 OK):**
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "redis": "connected",
      "timestamp": "2023-10-27T11:00:00.000Z"
    }
    ```
*   **Error Response (500 Internal Server Error):**
    *   If database or Redis connection fails.
```