# PerfMon Backend API Documentation

The PerfMon backend exposes a RESTful API for managing users, applications, pages, and ingesting/reporting performance metrics.

**Base URL**: `/api` (e.g., `http://localhost:5000/api`)

---

## Authentication

All protected endpoints require a JWT in the `Authorization` header: `Authorization: Bearer <token>`.
The performance data ingestion endpoint uses a custom `X-API-KEY` header.

### `POST /api/auth/register`
Register a new user.
*   **Request Body**:
    ```json
    {
        "username": "your_username",
        "email": "your_email@example.com",
        "password": "your_password"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
        "user": {
            "id": "uuid",
            "username": "your_username",
            "email": "your_email@example.com"
        },
        "token": "jwt_token_string"
    }
    ```
*   **Error Responses**: `400 Bad Request` (validation errors), `409 Conflict` (user already exists).

### `POST /api/auth/login`
Authenticate a user and get a JWT.
*   **Request Body**:
    ```json
    {
        "email": "your_email@example.com",
        "password": "your_password"
    }
    ```
*   **Response**: `200 OK`
    ```json
    {
        "user": {
            "id": "uuid",
            "username": "your_username",
            "email": "your_email@example.com"
        },
        "token": "jwt_token_string"
    }
    ```
*   **Error Responses**: `400 Bad Request` (validation errors), `401 Unauthorized` (invalid credentials).

### `GET /api/auth/me`
Get the authenticated user's profile. Requires JWT.
*   **Response**: `200 OK`
    ```json
    {
        "id": "uuid",
        "username": "your_username",
        "email": "your_email@example.com",
        "createdAt": "ISO_Date_String",
        "updatedAt": "ISO_Date_String"
    }
    ```
*   **Error Responses**: `401 Unauthorized`.

---

## User Management

User-specific routes require JWT authentication. A user can only access/modify their own profile.

### `GET /api/users/:id`
Get a user by ID.
*   **Path Params**: `id` (UUID of the user)
*   **Response**: `200 OK` (User object, similar to `/auth/me`)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden` (not your profile), `404 Not Found`.

### `PUT /api/users/:id`
Update a user's profile.
*   **Path Params**: `id` (UUID of the user)
*   **Request Body**: `Partial<User>` (e.g., `{ "username": "new_username" }` or `{ "passwordHash": "new_password" }`).
*   **Response**: `200 OK` (Updated user object, without password hash)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `DELETE /api/users/:id`
Delete a user's profile.
*   **Path Params**: `id` (UUID of the user)
*   **Response**: `200 OK`
    ```json
    { "message": "User deleted successfully" }
    ```
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## Application Management

Requires JWT authentication. Users can only manage applications they own.

### `POST /api/applications`
Create a new application to monitor.
*   **Request Body**:
    ```json
    {
        "name": "My E-commerce App",
        "description": "Monitors the main e-commerce website."
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
        "id": "uuid",
        "name": "My E-commerce App",
        "description": "Monitors the main e-commerce website.",
        "ownerId": "user_uuid",
        "apiKey": "GENERATED_API_KEY_STRING", # IMPORTANT: Save this!
        "createdAt": "ISO_Date_String",
        "updatedAt": "ISO_Date_String"
    }
    ```
*   **Error Responses**: `400 Bad Request`, `401 Unauthorized`.

### `GET /api/applications`
Get all applications owned by the authenticated user.
*   **Response**: `200 OK`
    ```json
    [
        {
            "id": "uuid",
            "name": "My E-commerce App",
            "description": "Monitors the main e-commerce website.",
            "ownerId": "user_uuid",
            "createdAt": "ISO_Date_String",
            "updatedAt": "ISO_Date_String"
        }
    ]
    ```
    *(Note: API keys are NOT returned in this list for security reasons.)*
*   **Error Responses**: `401 Unauthorized`.

### `GET /api/applications/:applicationId`
Get a specific application by ID.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Response**: `200 OK` (Full application object, including `apiKey`)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `PUT /api/applications/:applicationId`
Update an application's details.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Request Body**: `Partial<Application>` (e.g., `{ "name": "New Name" }`). `apiKey` cannot be updated via this route.
*   **Response**: `200 OK` (Updated application object)
*   **Error Responses**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `DELETE /api/applications/:applicationId`
Delete an application and all its associated pages and performance metrics.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Response**: `200 OK`
    ```json
    { "message": "Application deleted successfully" }
    ```
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `POST /api/applications/:applicationId/refresh-api-key`
Generate a new API key for an application. The old key becomes invalid immediately.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Response**: `200 OK` (Updated application object with the new `apiKey`)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## Page Management

Requires JWT authentication. Pages are nested under applications.

### `POST /api/applications/:applicationId/pages`
Create a new page for an application.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Request Body**:
    ```json
    {
        "name": "Homepage",
        "pathRegex": "/"
    }
    ```
*   **Response**: `201 Created` (Page object)
*   **Error Responses**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (application).

### `GET /api/applications/:applicationId/pages`
Get all pages for a specific application.
*   **Path Params**: `applicationId` (UUID of the application)
*   **Response**: `200 OK` (Array of page objects)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (application).

### `GET /api/applications/:applicationId/pages/:pageId`
Get a specific page by ID.
*   **Path Params**: `applicationId`, `pageId`
*   **Response**: `200 OK` (Page object)
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `PUT /api/applications/:applicationId/pages/:pageId`
Update a page's details.
*   **Path Params**: `applicationId`, `pageId`
*   **Request Body**: `Partial<Page>` (e.g., `{ "name": "New Home" }`).
*   **Response**: `200 OK` (Updated page object)
*   **Error Responses**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `DELETE /api/applications/:applicationId/pages/:pageId`
Delete a page and its associated performance metrics.
*   **Path Params**: `applicationId`, `pageId`
*   **Response**: `200 OK`
    ```json
    { "message": "Page deleted successfully" }
    ```
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## Performance Data Ingestion

This endpoint is designed for high-volume, client-side data submission. It requires an API Key.

### `POST /api/performance/metrics`
Ingest performance metrics from a client application.
*   **Headers**: `X-API-KEY: <application_api_key>`
*   **Request Body**:
    ```json
    {
        "metrics": [
            {
                "metricType": "FCP",
                "value": 250.5,
                "timestamp": "2023-10-27T10:00:00.000Z",
                "pageName": "Homepage",
                "url": "https://myapp.com/",
                "userSessionId": "uuid",
                "browser": "Chrome",
                "os": "Windows",
                "deviceType": "desktop",
                "country": "US"
            },
            {
                "metricType": "LCP",
                "value": 1200.7,
                "timestamp": "2023-10-27T10:00:01.000Z",
                "pageName": "Homepage",
                "url": "https://myapp.com/"
            }
        ]
    }
    ```
    *   `metricType`: String (e.g., "FCP", "LCP", "TTFB", "CLS", "customMetric").
    *   `value`: Number.
    *   `timestamp`: Optional. Defaults to server time if not provided.
    *   `pageName`: Optional. If provided and no matching `Page` exists, a new `Page` will be created dynamically.
    *   Other fields are optional descriptive metadata.
*   **Response**: `202 Accepted`
    ```json
    {
        "message": "Successfully ingested X metrics.",
        "count": X
    }
    ```
*   **Error Responses**: `400 Bad Request` (validation errors), `401 Unauthorized` (invalid/missing API key), `429 Too Many Requests` (rate limit exceeded).

---

## Reporting & Analytics

Requires JWT authentication. Users can only retrieve reports for applications they own. Most reporting endpoints are cached.

### `GET /api/reports/:applicationId/overview`
Get an overview of an application's performance.
*   **Path Params**: `applicationId`
*   **Query Params**: `periodDays` (optional, default 7) - number of days to aggregate data for.
*   **Response**: `200 OK`
    ```json
    {
        "totalMetrics": 1500,
        "avgLCP": 1234.56,
        "avgFCP": 567.89,
        "pageCount": 5,
        "periodDays": 7
    }
    ```
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `GET /api/reports/:applicationId/pages/:pageId/metrics`
Get detailed metrics for a specific page.
*   **Path Params**: `applicationId`, `pageId`
*   **Query Params**: `metricType` (required, e.g., "LCP"), `periodDays` (optional, default 7).
*   **Response**: `200 OK`
    ```json
    {
        "metrics": [
            {
                "id": "uuid",
                "metricType": "LCP",
                "value": 1234.5,
                "timestamp": "ISO_Date_String",
                "browser": "Chrome",
                "os": "macOS",
                // ... other metric details
            }
        ],
        "browserBreakdown": [
            { "browser": "Chrome", "averageValue": 1300.0 },
            { "browser": "Firefox", "averageValue": 1100.0 }
        ],
        "deviceBreakdown": [
            { "deviceType": "desktop", "averageValue": 1250.0 },
            { "deviceType": "mobile", "averageValue": 1400.0 }
        ]
    }
    ```
*   **Error Responses**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### `GET /api/reports/:applicationId/trends/:metricType`
Get trend data (average value per day) for a specific metric.
*   **Path Params**: `applicationId`, `metricType` (e.g., "FCP")
*   **Query Params**: `pageId` (optional, filter by a specific page), `periodDays` (optional, default 30).
*   **Response**: `200 OK`
    ```json
    [
        { "date": "2023-10-01T00:00:00.000Z", "averageValue": 550.2 },
        { "date": "2023-10-02T00:00:00.000Z", "averageValue": 580.1 },
        // ... daily average values
    ]
    ```
*   **Error Responses**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---