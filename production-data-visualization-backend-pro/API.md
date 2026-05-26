# 📝 DataViz Pro: REST API Documentation

This document describes the RESTful API endpoints for the DataViz Pro application. All endpoints are prefixed with `/api/v1`.

## Authentication

Authentication is performed using JSON Web Tokens (JWT). After successful login, a token is issued and must be included in the `Authorization` header of subsequent requests as `Bearer <token>`.

### Register User

*   **Endpoint:** `POST /api/v1/auth/register`
*   **Description:** Creates a new user account.
*   **Request Body:** `application/json`
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "secure_password123"
    }
    ```
*   **Success Response (201 Created):** `application/json`
    ```json
    {
      "id": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
      "username": "newuser",
      "email": "newuser@example.com"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing fields, invalid input (e.g., weak password).
    *   `409 Conflict`: Username or email already exists.

### Login User

*   **Endpoint:** `POST /api/v1/auth/login`
*   **Description:** Authenticates a user and returns a JWT token.
*   **Request Body:** `application/json`
    ```json
    {
      "username": "existinguser",
      "password": "secure_password123"
    }
    ```
*   **Success Response (200 OK):** `application/json`
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJib2Uyb..."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing username or password.
    *   `401 Unauthorized`: Invalid username or password.

## User Endpoints

### Get Current User Profile

*   **Endpoint:** `GET /api/v1/users/me`
*   **Description:** Retrieves the profile of the authenticated user.
*   **Authentication:** Required (JWT in `Authorization` header).
*   **Success Response (200 OK):** `application/json`
    ```json
    {
      "id": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
      "username": "admin",
      "email": "admin@example.com"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: User profile not found (should not happen with valid token).

## Dataset Endpoints

### Upload New Dataset

*   **Endpoint:** `POST /api/v1/datasets`
*   **Description:** Uploads a new dataset file and saves its metadata.
*   **Authentication:** Required.
*   **Request Body:** `application/json`
    ```json
    {
      "name": "My Sales Data Q2",
      "description": "Sales figures for the second quarter.",
      "fileContent": "Date,Region,Sales\n2023-04-01,East,100\n2023-04-02,West,150",
      "fileExtension": "csv"
    }
    ```
    *   `fileContent`: Base64 encoded string of the file content (or raw string for small files).
    *   `fileExtension`: e.g., "csv", "json".
*   **Success Response (201 Created):** `application/json`
    ```json
    {
      "id": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
      "userId": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
      "name": "My Sales Data Q2",
      "description": "Sales figures for the second quarter.",
      "filePath": "data_storage/...", // Internal path, might not be exposed to frontend
      "schema": {
        "columns": [
          {"name": "Date", "type": "string"},
          {"name": "Region", "type": "string"},
          {"name": "Sales", "type": "string"}
        ]
      },
      "rowCount": 2,
      "uploadedAt": 1678886400
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields, invalid input.
    *   `401 Unauthorized`: Invalid token.
    *   `409 Conflict`: Dataset with this name already exists for the user.
    *   `500 Internal Server Error`: File storage or processing failed.

### Get All Datasets

*   **Endpoint:** `GET /api/v1/datasets`
*   **Description:** Retrieves a list of all datasets owned by the authenticated user.
*   **Authentication:** Required.
*   **Success Response (200 OK):** `application/json`
    ```json
    [
      {
        "id": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
        "userId": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
        "name": "My Sales Data Q2",
        "description": "Sales figures for the second quarter.",
        "rowCount": 2,
        "uploadedAt": 1678886400
      }
      // ... more datasets
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.

### Get Dataset by ID

*   **Endpoint:** `GET /api/v1/datasets/{dataset_id}`
*   **Description:** Retrieves detailed information for a specific dataset.
*   **Authentication:** Required.
*   **Success Response (200 OK):** `application/json` (same as `Upload New Dataset` success response)
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dataset not found or user is not authorized to access it.

### Update Dataset Metadata

*   **Endpoint:** `PUT /api/v1/datasets/{dataset_id}`
*   **Description:** Updates the name and/or description of a dataset.
*   **Authentication:** Required.
*   **Request Body:** `application/json`
    ```json
    {
      "name": "Updated Sales Data Q2",
      "description": "Revised sales figures for the second quarter."
    }
    ```
*   **Success Response (200 OK):** `application/json` (updated dataset object)
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields.
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dataset not found or user is not authorized.
    *   `409 Conflict`: New name already exists for another dataset by this user.

### Delete Dataset

*   **Endpoint:** `DELETE /api/v1/datasets/{dataset_id}`
*   **Description:** Deletes a dataset and its associated file.
*   **Authentication:** Required.
*   **Success Response (204 No Content):** Empty body.
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dataset not found or user is not authorized.

### Get Dataset Sample Data

*   **Endpoint:** `GET /api/v1/datasets/{dataset_id}/data`
*   **Description:** Retrieves a sample of the raw data from the dataset file.
*   **Authentication:** Required.
*   **Query Parameters:**
    *   `limit` (optional): Number of rows to return. Default is 100.
*   **Success Response (200 OK):** `application/json`
    ```json
    [
      {"Date": "2023-04-01", "Region": "East", "Sales": "100"},
      {"Date": "2023-04-02", "Region": "West", "Sales": "150"}
    ]
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid `limit` parameter.
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dataset not found or user is not authorized.
    *   `500 Internal Server Error`: Failed to read data file.

## Dashboard Endpoints

### Create New Dashboard

*   **Endpoint:** `POST /api/v1/dashboards`
*   **Description:** Creates a new dashboard.
*   **Authentication:** Required.
*   **Request Body:** `application/json`
    ```json
    {
      "name": "Executive Sales Overview",
      "description": "KPIs for sales executives",
      "config": {
        "layout": [
          {"i": "chart1", "x": 0, "y": 0, "w": 6, "h": 5},
          {"i": "chart2", "x": 6, "y": 0, "w": 6, "h": 5}
        ],
        "widgets": {
          "chart1": {
            "type": "bar_chart",
            "title": "Sales by Region",
            "datasetId": "d2e4e6f1-7f9c-4b3d-9a2c-2d4e6f8a0b2c",
            "xField": "Region",
            "yField": "Sales"
          }
        }
      }
    }
    ```
*   **Success Response (201 Created):** `application/json`
    ```json
    {
      "id": "e3f5f7g1-8a0d-4c4e-9b3d-3e5f7g9b1d3e",
      "userId": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
      "name": "Executive Sales Overview",
      "description": "KPIs for sales executives",
      "config": { /* ... same config as request ... */ },
      "createdAt": 1678886400,
      "updatedAt": 1678886400
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields.
    *   `401 Unauthorized`: Invalid token.
    *   `409 Conflict`: Dashboard with this name already exists for the user.

### Get All Dashboards

*   **Endpoint:** `GET /api/v1/dashboards`
*   **Description:** Retrieves a list of all dashboards owned by the authenticated user (summary).
*   **Authentication:** Required.
*   **Success Response (200 OK):** `application/json`
    ```json
    [
      {
        "id": "e3f5f7g1-8a0d-4c4e-9b3d-3e5f7g9b1d3e",
        "userId": "b0e2b4f0-5c7a-4d3e-9f1a-0b5c7a4d3e9f",
        "name": "Executive Sales Overview",
        "description": "KPIs for sales executives",
        "createdAt": 1678886400
      }
      // ... more dashboards
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.

### Get Dashboard by ID

*   **Endpoint:** `GET /api/v1/dashboards/{dashboard_id}`
*   **Description:** Retrieves detailed information and configuration for a specific dashboard.
*   **Authentication:** Required.
*   **Success Response (200 OK):** `application/json` (same as `Create New Dashboard` success response)
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dashboard not found or user is not authorized.

### Update Dashboard

*   **Endpoint:** `PUT /api/v1/dashboards/{dashboard_id}`
*   **Description:** Updates the name, description, and/or configuration of a dashboard.
*   **Authentication:** Required.
*   **Request Body:** `application/json`
    ```json
    {
      "name": "Revised Sales Overview",
      "description": "Updated KPIs and new layout.",
      "config": {
        "layout": [ /* ... updated layout ... */ ],
        "widgets": { /* ... updated widgets ... */ }
      }
    }
    ```
*   **Success Response (200 OK):** `application/json` (updated dashboard object)
*   **Error Responses:**
    *   `400 Bad Request`: Missing required fields.
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dashboard not found or user is not authorized.
    *   `409 Conflict`: New name already exists for another dashboard by this user.

### Delete Dashboard

*   **Endpoint:** `DELETE /api/v1/dashboards/{dashboard_id}`
*   **Description:** Deletes a dashboard.
*   **Authentication:** Required.
*   **Success Response (204 No Content):** Empty body.
*   **Error Responses:**
    *   `401 Unauthorized`: Invalid token.
    *   `404 Not Found`: Dashboard not found or user is not authorized.

---
```