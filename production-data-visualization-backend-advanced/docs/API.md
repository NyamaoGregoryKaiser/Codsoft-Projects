# DataViz Pro API Documentation

This document describes the RESTful API endpoints for the DataViz Pro backend. All endpoints are prefixed with `/api`.

## Base URL

`http://localhost:5000/api` (Development)
`/api` (Production, relative to frontend)

## Authentication

All protected endpoints require a JSON Web Token (JWT) passed in the `Authorization` header as `Bearer <token>`.

### 1. Auth Endpoints

*   **`POST /api/auth/register`**
    *   **Description:** Registers a new user and returns a JWT.
    *   **Request Body:**
        ```json
        {
            "username": "your_username",
            "email": "your_email@example.com",
            "password": "your_password"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
            "status": "success",
            "token": "eyJhbGciOiJIUzI1Ni...",
            "data": {
                "user": {
                    "id": "uuid",
                    "username": "your_username",
                    "email": "your_email@example.com",
                    "role": "user",
                    "createdAt": "...",
                    "updatedAt": "..."
                }
            }
        }
        ```
    *   **Error (400 Bad Request):** If email/username already exists or password is too short.

*   **`POST /api/auth/login`**
    *   **Description:** Logs in an existing user and returns a JWT.
    *   **Request Body:**
        ```json
        {
            "email": "your_email@example.com",
            "password": "your_password"
        }
        ```
    *   **Response (200 OK):** (Same as register response)
    *   **Error (401 Unauthorized):** If email/password is incorrect.

### 2. User Endpoints (Admin Only)

*Protected by `protect` and `authorize('admin')` middleware.*

*   **`GET /api/users`**
    *   **Description:** Get all users.
    *   **Response (200 OK):**
        ```json
        {
            "status": "success",
            "results": 2,
            "data": {
                "users": [
                    { "id": "uuid", "username": "admin", "email": "admin@example.com", "role": "admin", ... },
                    { "id": "uuid", "username": "user", "email": "user@example.com", "role": "user", ... }
                ]
            }
        }
        ```
*   **`GET /api/users/:id`**
    *   **Description:** Get a user by ID.
    *   **Response (200 OK):**
        ```json
        {
            "status": "success",
            "data": {
                "user": { "id": "uuid", "username": "user", "email": "user@example.com", "role": "user", ... }
            }
        }
        ```
    *   **Error (404 Not Found):** If user does not exist.
*   **`PUT /api/users/:id`**
    *   **Description:** Update a user's details (excluding password).
    *   **Request Body:**
        ```json
        {
            "username": "new_username",
            "role": "admin"
        }
        ```
    *   **Response (200 OK):** Updated user object.
*   **`DELETE /api/users/:id`**
    *   **Description:** Delete a user.
    *   **Response (204 No Content)**

### 3. Data Source Endpoints

*Protected by `protect` middleware.*

*   **`POST /api/data-sources`**
    *   **Description:** Create a new data source.
    *   **Request Body:**
        ```json
        {
            "name": "My Sales Data",
            "type": "mock_data",
            "config": {
                "data": [
                    {"month": "Jan", "sales": 100},
                    {"month": "Feb", "sales": 120}
                ],
                "columns": ["month", "sales"],
                "description": "Monthly sales figures"
            }
        }
        ```
    *   **Response (201 Created):** New data source object.
*   **`GET /api/data-sources`**
    *   **Description:** Get all data sources owned by the authenticated user (or all if admin).
    *   **Response (200 OK):** Array of data source objects.
*   **`GET /api/data-sources/:id`**
    *   **Description:** Get a specific data source by ID.
    *   **Response (200 OK):** Single data source object.
*   **`PUT /api/data-sources/:id`**
    *   **Description:** Update a data source.
    *   **Request Body:** (Partial data source object)
    *   **Response (200 OK):** Updated data source object.
*   **`DELETE /api/data-sources/:id`**
    *   **Description:** Delete a data source.
    *   **Response (204 No Content)**
*   **`GET /api/data-sources/:id/data`**
    *   **Description:** Fetches the actual data from the data source (based on its type and config).
    *   **Response (200 OK):**
        ```json
        {
            "status": "success",
            "data": {
                "data": [
                    {"month": "Jan", "sales": 100},
                    {"month": "Feb", "sales": 120}
                ]
            }
        }
        ```
    *   **Error (501 Not Implemented):** For `api_endpoint`, `csv_upload`, `database_query` types in this demo.

### 4. Chart Endpoints

*Protected by `protect` middleware.*

*   **`POST /api/charts`**
    *   **Description:** Create a new chart.
    *   **Request Body:**
        ```json
        {
            "name": "Monthly Sales Bar Chart",
            "description": "Bar chart of monthly sales",
            "type": "bar",
            "dataSourceId": "uuid-of-data-source",
            "config": {
                "title": { "text": "Sales" },
                "tooltip": {},
                "xAxis": { "type": "category", "data": ["Jan", "Feb"] },
                "yAxis": { "type": "value" },
                "series": [{ "name": "Sales", "type": "bar", "data": [100, 120] }]
            }
        }
        ```
    *   **Response (201 Created):** New chart object.
*   **`GET /api/charts`**
    *   **Description:** Get all charts owned by the authenticated user (or all if admin).
    *   **Response (200 OK):** Array of chart objects, includes `dataSource` name and type.
*   **`GET /api/charts/:id`**
    *   **Description:** Get a specific chart by ID.
    *   **Response (200 OK):** Single chart object, includes `dataSource` name, type, and config.
*   **`PUT /api/charts/:id`**
    *   **Description:** Update a chart.
    *   **Request Body:** (Partial chart object)
    *   **Response (200 OK):** Updated chart object.
*   **`DELETE /api/charts/:id`**
    *   **Description:** Delete a chart.
    *   **Response (204 No Content)**
*   **`GET /api/charts/:id/data`**
    *   **Description:** Fetches the chart's configuration and its associated raw data from the data source.
    *   **Response (200 OK):**
        ```json
        {
            "status": "success",
            "data": {
                "chartConfig": { ... }, // Echarts config
                "data": [ ... ] // Raw data from data source
            }
        }
        ```

### 5. Dashboard Endpoints

*Protected by `protect` middleware.*

*   **`POST /api/dashboards`**
    *   **Description:** Create a new dashboard.
    *   **Request Body:**
        ```json
        {
            "name": "Executive Dashboard",
            "description": "Overview of key metrics",
            "layout": [
                { "i": "uuid-of-chart-1", "x": 0, "y": 0, "w": 6, "h": 6 },
                { "i": "uuid-of-chart-2", "x": 6, "y": 0, "w": 6, "h": 6 }
            ]
        }
        ```
    *   **Response (201 Created):** New dashboard object.
*   **`GET /api/dashboards`**
    *   **Description:** Get all dashboards owned by the authenticated user (or all if admin).
    *   **Response (200 OK):** Array of dashboard objects.
*   **`GET /api/dashboards/:id`**
    *   **Description:** Get a specific dashboard by ID, including details of associated charts.
    *   **Response (200 OK):**
        ```json
        {
            "status": "success",
            "data": {
                "dashboard": {
                    "id": "uuid",
                    "name": "Executive Dashboard",
                    "description": "...",
                    "layout": [ ... ],
                    "userId": "...",
                    "charts": [ // Populated chart details
                        {
                            "i": "uuid-of-chart-1", "x": 0, "y": 0, "w": 6, "h": 6,
                            "chart": { "id": "...", "name": "...", "type": "...", "config": "{...}", "dataSourceId": "..." }
                        },
                        // ... other charts
                    ]
                }
            }
        }
        ```
*   **`PUT /api/dashboards/:id`**
    *   **Description:** Update a dashboard.
    *   **Request Body:** (Partial dashboard object)
    *   **Response (200 OK):** Updated dashboard object.
*   **`DELETE /api/dashboards/:id`**
    *   **Description:** Delete a dashboard.
    *   **Response (204 No Content)**

---