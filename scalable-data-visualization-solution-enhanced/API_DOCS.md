# API Documentation - Data Visualization System

This document outlines the RESTful API endpoints for the Data Visualization System backend.

**Base URL:** `/api` (e.g., `http://localhost:5000/api`)

## Authentication

All protected endpoints require a valid JWT Access Token in the `Authorization` header, prefixed with `Bearer`.

```
Authorization: Bearer <your_jwt_token>
```

### 1. Auth Endpoints

*   **`POST /api/auth/register`**
    *   **Description:** Registers a new user.
    *   **Body:**
        ```json
        {
          "username": "john.doe",
          "email": "john.doe@example.com",
          "password": "strong_password",
          "role": "user" // Optional, default is 'user'
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "User registered successfully",
          "user": {
            "id": "uuid",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "user",
            "createdAt": "timestamp"
          }
        }
        ```
    *   **Error Codes:** 400 (Bad Request), 409 (Conflict - email/username already exists)

*   **`POST /api/auth/login`**
    *   **Description:** Authenticates a user and returns JWT tokens.
    *   **Body:**
        ```json
        {
          "email": "john.doe@example.com",
          "password": "strong_password"
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "Logged in successfully",
          "accessToken": "jwt_access_token",
          "refreshToken": "jwt_refresh_token"
        }
        ```
    *   **Error Codes:** 400 (Bad Request), 401 (Unauthorized - invalid credentials)

*   **`POST /api/auth/refresh-token`**
    *   **Description:** Renews access token using a refresh token.
    *   **Body:**
        ```json
        {
          "refreshToken": "jwt_refresh_token"
        }
        ```
    *   **Response:**
        ```json
        {
          "accessToken": "new_jwt_access_token"
        }
        ```
    *   **Error Codes:** 400 (Bad Request), 401 (Unauthorized - invalid/expired refresh token)

### 2. User Endpoints (Admin Only)

*   **`GET /api/users`**
    *   **Description:** Retrieves a list of all users.
    *   **Auth:** Required (Admin Role)
    *   **Response:** `Array<User>`
    *   **Error Codes:** 401, 403

*   **`GET /api/users/:id`**
    *   **Description:** Retrieves a user by ID.
    *   **Auth:** Required (Admin Role)
    *   **Response:** `User` object
    *   **Error Codes:** 401, 403, 404

*   **`PUT /api/users/:id`**
    *   **Description:** Updates a user's information.
    *   **Auth:** Required (Admin Role)
    *   **Body:**
        ```json
        {
          "username": "updated.user",
          "email": "updated.email@example.com",
          "role": "admin"
        }
        ```
    *   **Response:** `User` object (updated)
    *   **Error Codes:** 401, 403, 404, 400

*   **`DELETE /api/users/:id`**
    *   **Description:** Deletes a user by ID.
    *   **Auth:** Required (Admin Role)
    *   **Response:** `{ message: "User deleted successfully" }`
    *   **Error Codes:** 401, 403, 404

### 3. Dataset Endpoints

*   **`POST /api/datasets`**
    *   **Description:** Uploads a new dataset.
    *   **Auth:** Required (User/Admin Role)
    *   **Body:** (multipart/form-data)
        *   `name`: string (e.g., "Sales Data 2023")
        *   `description`: string (e.g., "Annual sales figures")
        *   `file`: file (CSV or JSON file)
    *   **Response:**
        ```json
        {
          "message": "Dataset uploaded successfully",
          "dataset": {
            "id": "uuid",
            "name": "Sales Data 2023",
            "description": "Annual sales figures",
            "userId": "uuid",
            "fileType": "csv",
            "createdAt": "timestamp"
          }
        }
        ```
    *   **Error Codes:** 401, 400 (Invalid file type/missing fields)

*   **`GET /api/datasets`**
    *   **Description:** Retrieves all datasets owned by the authenticated user.
    *   **Auth:** Required (User/Admin Role)
    *   **Response:** `Array<Dataset>`
    *   **Error Codes:** 401

*   **`GET /api/datasets/:id`**
    *   **Description:** Retrieves a specific dataset by ID.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `Dataset` object (includes `data` field)
    *   **Error Codes:** 401, 403, 404

*   **`PUT /api/datasets/:id`**
    *   **Description:** Updates metadata for a dataset.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Body:**
        ```json
        {
          "name": "Updated Sales Data",
          "description": "New description for sales data"
        }
        ```
    *   **Response:** `Dataset` object (updated)
    *   **Error Codes:** 401, 403, 404, 400

*   **`DELETE /api/datasets/:id`**
    *   **Description:** Deletes a dataset by ID.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `{ message: "Dataset deleted successfully" }`
    *   **Error Codes:** 401, 403, 404

### 4. Visualization Endpoints

*   **`POST /api/visualizations`**
    *   **Description:** Creates a new visualization.
    *   **Auth:** Required (User/Admin Role)
    *   **Body:**
        ```json
        {
          "name": "Sales by Month Bar Chart",
          "description": "Bar chart showing sales figures per month.",
          "datasetId": "uuid_of_dataset",
          "chartType": "bar",
          "config": {
            "labelsField": "month",
            "dataField": "sales",
            "title": "Monthly Sales",
            "backgroundColor": "#42a5f5"
          }
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "Visualization created successfully",
          "visualization": {
            "id": "uuid",
            "name": "Sales by Month Bar Chart",
            "chartType": "bar",
            "datasetId": "uuid",
            "userId": "uuid",
            "config": { ... },
            "createdAt": "timestamp"
          }
        }
        ```
    *   **Error Codes:** 401, 400 (Invalid config/missing fields)

*   **`GET /api/visualizations`**
    *   **Description:** Retrieves all visualizations owned by the authenticated user.
    *   **Auth:** Required (User/Admin Role)
    *   **Response:** `Array<Visualization>`
    *   **Error Codes:** 401

*   **`GET /api/visualizations/:id`**
    *   **Description:** Retrieves a specific visualization by ID.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `Visualization` object
    *   **Error Codes:** 401, 403, 404

*   **`PUT /api/visualizations/:id`**
    *   **Description:** Updates a visualization's configuration.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Body:**
        ```json
        {
          "name": "Updated Sales Chart",
          "chartType": "line",
          "config": {
            "labelsField": "month",
            "dataField": "sales",
            "title": "Monthly Sales Trend",
            "borderColor": "#ff6384"
          }
        }
        ```
    *   **Response:** `Visualization` object (updated)
    *   **Error Codes:** 401, 403, 404, 400

*   **`DELETE /api/visualizations/:id`**
    *   **Description:** Deletes a visualization by ID.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `{ message: "Visualization deleted successfully" }`
    *   **Error Codes:** 401, 403, 404

### 5. Dashboard Endpoints

*   **`POST /api/dashboards`**
    *   **Description:** Creates a new dashboard.
    *   **Auth:** Required (User/Admin Role)
    *   **Body:**
        ```json
        {
          "name": "Q4 Sales Performance",
          "description": "Dashboard showing key Q4 sales metrics.",
          "layout": [] // Array of { visualizationId: string, x: number, y: number, w: number, h: number }
        }
        ```
    *   **Response:**
        ```json
        {
          "message": "Dashboard created successfully",
          "dashboard": {
            "id": "uuid",
            "name": "Q4 Sales Performance",
            "userId": "uuid",
            "layout": [],
            "createdAt": "timestamp"
          }
        }
        ```
    *   **Error Codes:** 401, 400

*   **`GET /api/dashboards`**
    *   **Description:** Retrieves all dashboards owned by the authenticated user.
    *   **Auth:** Required (User/Admin Role)
    *   **Response:** `Array<Dashboard>`
    *   **Error Codes:** 401

*   **`GET /api/dashboards/:id`**
    *   **Description:** Retrieves a specific dashboard by ID, including its visualizations.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `Dashboard` object (with `visualizations` array populated)
    *   **Error Codes:** 401, 403, 404

*   **`PUT /api/dashboards/:id`**
    *   **Description:** Updates a dashboard's details and layout.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Body:**
        ```json
        {
          "name": "Updated Q4 Sales",
          "layout": [
            { "visualizationId": "viz_uuid_1", "x": 0, "y": 0, "w": 6, "h": 4 },
            { "visualizationId": "viz_uuid_2", "x": 6, "y": 0, "w": 6, "h": 4 }
          ]
        }
        ```
    *   **Response:** `Dashboard` object (updated)
    *   **Error Codes:** 401, 403, 404, 400

*   **`DELETE /api/dashboards/:id`**
    *   **Description:** Deletes a dashboard by ID.
    *   **Auth:** Required (User/Admin Role - Must be owner or admin)
    *   **Response:** `{ message: "Dashboard deleted successfully" }`
    *   **Error Codes:** 401, 403, 404

---