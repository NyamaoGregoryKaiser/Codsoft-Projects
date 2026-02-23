```markdown
# API Documentation

This document describes the RESTful API endpoints for the Enterprise Data Visualization Tools System.

**Base URL:** `/api` (e.g., `http://localhost:5000/api`)

**Authentication:**
All protected endpoints require a valid JWT Access Token sent in the `Authorization` header as a Bearer token: `Authorization: Bearer <access_token>`.
Access tokens expire and can be refreshed using the `/api/refresh` endpoint with a Refresh Token.

**Error Handling:**
Errors are returned as JSON objects with a `code` (HTTP status code), `name` (error type), and `description` (human-readable message).

```json
{
  "code": 400,
  "name": "Bad Request",
  "description": "Username, email, and password are required."
}
```

---

## Auth Endpoints

### `POST /api/register`

Register a new user.

*   **Rate Limit:** 5 per hour
*   **Request Body:** `application/json`
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "strongpassword123",
      "roles": ["user"]  // Optional: Array of role names. Default is ["user"]. Admin only to assign "admin" or "editor" roles.
    }
    ```
*   **Response (201 Created):** `application/json`
    ```json
    {
      "id": 1,
      "username": "newuser",
      "email": "newuser@example.com",
      "roles": ["user"],
      "created_at": "2023-11-20T10:00:00.000Z",
      "updated_at": "2023-11-20T10:00:00.000Z"
    }
    ```
*   **Error Responses:** 400 (Bad Request), 409 (Conflict - username/email exists)

### `POST /api/login`

Authenticate a user and get JWT tokens.

*   **Rate Limit:** 10 per minute
*   **Request Body:** `application/json`
    ```json
    {
      "username": "existinguser",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK):** `application/json`
    ```json
    {
      "user": {
        "id": 1,
        "username": "existinguser",
        "email": "existinguser@example.com",
        "roles": ["user"],
        "created_at": "2023-11-20T10:00:00.000Z",
        "updated_at": "2023-11-20T10:00:00.000Z"
      },
      "access_token": "eyJ...",
      "refresh_token": "eyJ..."
    }
    ```
*   **Error Responses:** 400 (Bad Request), 401 (Unauthorized - invalid credentials)

### `POST /api/refresh`

Refresh an expired access token using a refresh token.

*   **Authentication:** Requires a valid *Refresh Token* in the `Authorization` header.
*   **Request Body:** None
*   **Response (200 OK):** `application/json`
    ```json
    {
      "access_token": "eyJ..."
    }
    ```
*   **Error Responses:** 401 (Unauthorized - invalid/expired refresh token)

### `GET /api/protected`

Example protected endpoint to verify token and get user claims.

*   **Authentication:** Requires a valid *Access Token*.
*   **Request Body:** None
*   **Response (200 OK):** `application/json`
    ```json
    {
      "logged_in_as": 1,
      "roles": ["editor", "admin"]
    }
    ```
*   **Error Responses:** 401 (Unauthorized - missing/invalid/expired token)

---

## Data Source Endpoints

All endpoints require authentication. `POST`, `PUT`, `DELETE` require `editor` or `admin` role.

### `GET /api/data_sources`

Get all data sources for the authenticated user.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Array of data source objects)
    ```json
    [
      {
        "id": 1,
        "name": "Sales DB",
        "type": "postgresql",
        "user_id": 1,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
    ```

### `GET /api/data_sources/<int:ds_id>`

Get a specific data source by ID.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Single data source object)
*   **Error Responses:** 404 (Not Found - data source not found or unauthorized)

### `POST /api/data_sources`

Create a new data source.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 10 per hour
*   **Request Body:** `application/json`
    ```json
    {
      "name": "New Customer Data",
      "type": "mysql",
      "connection_string": "mysql+mysqlconnector://user:pass@host:3306/customer_db"
    }
    ```
    **Note:** In a production system, `connection_string` should be encrypted at rest and in transit.
*   **Response (201 Created):** `application/json` (New data source object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 409 (Conflict - name already exists for user)

### `PUT /api/data_sources/<int:ds_id>`

Update an existing data source.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 20 per hour
*   **Request Body:** `application/json` (Fields to update)
    ```json
    {
      "name": "Updated Customer Data",
      "type": "postgresql"
    }
    ```
*   **Response (200 OK):** `application/json` (Updated data source object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

### `DELETE /api/data_sources/<int:ds_id>`

Delete a data source.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 5 per hour
*   **Response (200 OK):** `application/json`
    ```json
    {
      "message": "Data source deleted successfully."
    }
    ```
*   **Error Responses:** 403 (Forbidden), 404 (Not Found)

### `POST /api/data_sources/<int:ds_id>/query`

Execute a query against a data source.

*   **Authentication:** Access Token
*   **Rate Limit:** 30 per minute
*   **Request Body:** `application/json`
    ```json
    {
      "query_string": "SELECT id, name FROM users WHERE age > 30"
    }
    ```
*   **Response (200 OK):** `application/json` (Array of objects representing query results)
    ```json
    [
      {"id": 1, "name": "Alice"},
      {"id": 2, "name": "Bob"}
    ]
    ```
*   **Error Responses:** 400 (Bad Request - invalid query/data source type), 404 (Not Found - data source), 500 (Internal Server Error - query execution failed)

### `GET /api/data_sources/<int:ds_id>/tables`

Get a list of table names available in a data source.

*   **Authentication:** Access Token
*   **Rate Limit:** 10 per minute
*   **Response (200 OK):** `application/json` (Array of table names)
    ```json
    ["users", "products", "orders"]
    ```

### `GET /api/data_sources/<int:ds_id>/tables/<string:table_name>/columns`

Get column names and data types for a specific table in a data source.

*   **Authentication:** Access Token
*   **Rate Limit:** 20 per minute
*   **Response (200 OK):** `application/json` (Array of column objects)
    ```json
    [
      {"column_name": "id", "data_type": "integer"},
      {"column_name": "name", "data_type": "character varying"},
      {"column_name": "age", "data_type": "integer"}
    ]
    ```

---

## Visualization Endpoints

All endpoints require authentication. `POST`, `PUT`, `DELETE` require `editor` or `admin` role.

### `GET /api/visualizations`

Get all visualizations for the authenticated user.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Array of visualization objects)

### `GET /api/visualizations/<int:viz_id>`

Get a specific visualization by ID.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Single visualization object)
*   **Error Responses:** 404 (Not Found)

### `POST /api/visualizations`

Create a new visualization.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 10 per hour
*   **Request Body:** `application/json`
    ```json
    {
      "name": "Monthly Sales Bar Chart",
      "description": "Bar chart showing total sales per month.",
      "chart_type": "bar",
      "query_config": {
        "query_string": "SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(sales) AS total_sales FROM orders GROUP BY month ORDER BY month",
        "x_field": "month",
        "y_field": "total_sales"
      },
      "chart_config": {
        "title": "Monthly Sales",
        "x_axis_label": "Month",
        "y_axis_label": "Total Sales",
        "color": "#FF6384"
      },
      "data_source_id": 1
    }
    ```
*   **Response (201 Created):** `application/json` (New visualization object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 409 (Conflict)

### `PUT /api/visualizations/<int:viz_id>`

Update an existing visualization.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 20 per hour
*   **Request Body:** `application/json` (Fields to update)
*   **Response (200 OK):** `application/json` (Updated visualization object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

### `DELETE /api/visualizations/<int:viz_id>`

Delete a visualization.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 5 per hour
*   **Response (200 OK):** `application/json`
    ```json
    {
      "message": "Visualization deleted successfully."
    }
    ```
*   **Error Responses:** 403 (Forbidden), 404 (Not Found)

### `GET /api/visualizations/<int:viz_id>/data`

Get processed data for a specific visualization. This endpoint automatically executes the `query_config` defined for the visualization.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Array of objects, raw data based on `query_config`)
*   **Error Responses:** 404 (Not Found), 500 (Internal Server Error - data fetching failed)

---

## Dashboard Endpoints

All endpoints require authentication, except `GET /api/dashboards/public/<int:dashboard_id>`. `POST`, `PUT`, `DELETE` require `editor` or `admin` role.

### `GET /api/dashboards`

Get all dashboards for the authenticated user.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Array of dashboard objects)

### `GET /api/dashboards/<int:dashboard_id>`

Get a specific dashboard by ID.

*   **Authentication:** Access Token
*   **Rate Limit:** 60 per minute
*   **Response (200 OK):** `application/json` (Single dashboard object, including nested visualizations)
*   **Error Responses:** 404 (Not Found)

### `GET /api/dashboards/public/<int:dashboard_id>`

Get a publicly accessible dashboard by ID.

*   **Authentication:** None required
*   **Rate Limit:** 100 per minute
*   **Response (200 OK):** `application/json` (Single dashboard object, including nested visualizations)
*   **Error Responses:** 404 (Not Found - if dashboard is not public or doesn't exist)

### `POST /api/dashboards`

Create a new dashboard.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 10 per hour
*   **Request Body:** `application/json`
    ```json
    {
      "name": "My Sales Dashboard",
      "description": "An overview of key sales metrics.",
      "layout": [
        {"i": "1", "x": 0, "y": 0, "w": 6, "h": 10},
        {"i": "2", "x": 6, "y": 0, "w": 6, "h": 10}
      ],
      "visualization_ids": [1, 2], // IDs of visualizations to include
      "is_public": false
    }
    ```
    *   `layout`: An array of objects describing the position and size of visualizations on the dashboard (e.g., compatible with React Grid Layout). The `i` field should correspond to the visualization ID.
*   **Response (201 Created):** `application/json` (New dashboard object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 409 (Conflict)

### `PUT /api/dashboards/<int:dashboard_id>`

Update an existing dashboard.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 20 per hour
*   **Request Body:** `application/json` (Fields to update, including `visualization_ids` to change associated visualizations)
*   **Response (200 OK):** `application/json` (Updated dashboard object)
*   **Error Responses:** 400 (Bad Request), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

### `DELETE /api/dashboards/<int:dashboard_id>`

Delete a dashboard.

*   **Authentication:** Access Token (`editor` or `admin` role required)
*   **Rate Limit:** 5 per hour
*   **Response (200 OK):** `application/json`
    ```json
    {
      "message": "Dashboard deleted successfully."
    }
    ```
*   **Error Responses:** 403 (Forbidden), 404 (Not Found)
```