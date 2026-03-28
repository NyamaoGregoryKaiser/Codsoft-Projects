# DataVizPro Backend API Documentation

The DataVizPro backend exposes a RESTful API for managing users, data sources, dashboards, and visualizations. This documentation outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL

`http://localhost:8080/api/v1` (for local development)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token.

**Header**: `Authorization: Bearer <YOUR_JWT_TOKEN>`

### Auth Endpoints

#### 1. User Registration
- **Endpoint**: `/api/v1/auth/register`
- **Method**: `POST`
- **Description**: Registers a new user with default `USER` role.
- **Request Body**:
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "securepassword123"
    }
    ```
- **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "username": "newuser",
      "roles": ["USER"]
    }
    ```
- **Error Responses**: 400 Bad Request (e.g., username/email already exists, validation errors)

#### 2. User Authentication
- **Endpoint**: `/api/v1/auth/authenticate`
- **Method**: `POST`
- **Description**: Authenticates an existing user and returns a JWT token.
- **Request Body**:
    ```json
    {
      "username": "admin",
      "password": "admin123"
    }
    ```
- **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "username": "admin",
      "roles": ["ADMIN", "USER"]
    }
    ```
- **Error Responses**: 401 Unauthorized (invalid credentials), 400 Bad Request (validation errors)

## Data Sources

Manage connections to external data sources.

### Data Source DTO Example
```json
{
  "id": 1,
  "name": "My Sales Database",
  "type": "POSTGRESQL",
  "connectionString": "jdbc:postgresql://host:port/dbname",
  "username": "dbuser",
  "ownerUsername": "admin",
  "createdAt": "2023-01-01T10:00:00",
  "updatedAt": "2023-01-01T10:00:00"
}
```
*Note: `password` is never returned in DTOs for security reasons.*

#### 1. Create Data Source
- **Endpoint**: `/api/v1/data-sources`
- **Method**: `POST`
- **Roles**: `ADMIN`, `USER`
- **Description**: Creates a new data source definition.
- **Request Body**: (Similar to DTO, but includes password)
    ```json
    {
      "name": "New Prod DB",
      "type": "POSTGRESQL",
      "connectionString": "jdbc:postgresql://prodhost:5432/prod_db",
      "username": "produser",
      "password": "prodpassword"
    }
    ```
- **Response (201 Created)**: `ApiResponse<DataSourceDto>`
- **Error Responses**: 400 Bad Request, 403 Forbidden

#### 2. Get All Data Sources
- **Endpoint**: `/api/v1/data-sources`
- **Method**: `GET`
- **Roles**: `ADMIN`, `USER`, `VIEWER` (Returns only owned sources for non-ADMINs)
- **Response (200 OK)**: `ApiResponse<List<DataSourceDto>>`

#### 3. Get Data Source by ID
- **Endpoint**: `/api/v1/data-sources/{id}`
- **Method**: `GET`
- **Roles**: `ADMIN`, `Owner`
- **Response (200 OK)**: `ApiResponse<DataSourceDto>`
- **Error Responses**: 404 Not Found, 403 Forbidden (if not owner/admin)

#### 4. Update Data Source
- **Endpoint**: `/api/v1/data-sources/{id}`
- **Method**: `PUT`
- **Roles**: `ADMIN`, `Owner`
- **Request Body**: (Same as create, password is optional and only updates if provided)
- **Response (200 OK)**: `ApiResponse<DataSourceDto>`
- **Error Responses**: 400 Bad Request, 404 Not Found, 403 Forbidden

#### 5. Delete Data Source
- **Endpoint**: `/api/v1/data-sources/{id}`
- **Method**: `DELETE`
- **Roles**: `ADMIN`, `Owner`
- **Response (200 OK)**: `ApiResponse<Void>`
- **Error Responses**: 404 Not Found, 403 Forbidden

#### 6. Test Data Source Connection
- **Endpoint**: `/api/v1/data-sources/test-connection`
- **Method**: `POST`
- **Roles**: `ADMIN`, `USER`
- **Description**: Tests the connection details for a potential or existing data source without saving it.
- **Request Body**: (Same as create, including password)
- **Response (200 OK)**: `ApiResponse<String>` (e.g., "Connection successful")
- **Error Responses**: 400 Bad Request (e.g., connection failed)

## Dashboards

Manage interactive dashboards.

#### Dashboard DTO Example
```json
{
  "id": 101,
  "name": "Executive Dashboard",
  "description": "Key metrics for executives",
  "layout": {
    "panels": [
      { "id": "viz1", "x": 0, "y": 0, "w": 6, "h": 4 },
      { "id": "viz2", "x": 6, "y": 0, "w": 6, "h": 4 }
    ]
  },
  "ownerUsername": "admin",
  "isPublic": true,
  "createdAt": "2023-01-01T11:00:00",
  "updatedAt": "2023-01-01T11:00:00"
}
```

(Similar CRUD operations and authorization rules as Data Sources would follow for Dashboards and Visualizations.)

## Visualizations

Define and configure individual charts or tables.

#### Visualization DTO Example
```json
{
  "id": 201,
  "name": "Monthly Revenue Trend",
  "description": "Line chart showing revenue over time",
  "dashboardId": 101,
  "dataSourceId": 1,
  "chartType": "LINE_CHART",
  "queryConfig": {
    "sql": "SELECT date_trunc('month', order_date) as month, SUM(amount) as revenue FROM sales GROUP BY month ORDER BY month",
    "x_axis": "month",
    "y_axis": "revenue"
  },
  "chartConfig": {
    "title": "Revenue by Month",
    "xAxisType": "time",
    "yAxisLabel": "USD",
    "lineColor": "#4CAF50"
  },
  "ownerUsername": "admin",
  "createdAt": "2023-01-01T12:00:00",
  "updatedAt": "2023-01-01T12:00:00"
}
```

(Similar CRUD operations and authorization rules as Data Sources would follow for Visualizations.)

## Data Execution (conceptual endpoint)

This endpoint would be used by the frontend to fetch data for a visualization based on its configuration.

#### 1. Get Visualization Data
- **Endpoint**: `/api/v1/visualizations/{id}/data`
- **Method**: `POST` (or `GET` with query params if simpler)
- **Roles**: `ADMIN`, `USER`, `VIEWER` (with appropriate dashboard/viz sharing)
- **Description**: Executes the query defined in a visualization's configuration against its data source and returns the raw data.
- **Request Body**: (Optional: might include runtime filters, date ranges not stored in the viz config)
    ```json
    {
      "filters": [
        {"field": "region", "operator": "=", "value": "Europe"},
        {"field": "year", "operator": ">=", "value": 2022}
      ],
      "startDate": "2022-01-01",
      "endDate": "2023-12-31"
    }
    ```
- **Response (200 OK)**: `ApiResponse<List<Map<String, Object>>>`
    ```json
    {
      "success": true,
      "message": "Data fetched successfully",
      "data": [
        {"month": "2022-01", "revenue": 10000},
        {"month": "2022-02", "revenue": 12000},
        ...
      ]
    }
    ```
- **Error Responses**: 400 Bad Request (e.g., invalid query, connection error), 403 Forbidden.

## OpenAPI (Swagger UI)

For a real-time, interactive documentation, you can access the Swagger UI:
`http://localhost:8080/swagger-ui.html`

This interface allows you to:
- View all available endpoints.
- Understand request parameters and response schemas.
- Try out API calls directly from your browser (after authenticating via the "Authorize" button using a JWT token).
```