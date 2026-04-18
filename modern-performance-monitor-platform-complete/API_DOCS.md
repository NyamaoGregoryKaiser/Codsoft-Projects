```markdown
# PerfoMetrics API Documentation

This document provides a comprehensive overview of the PerfoMetrics Backend API endpoints.

**Base URL:** `/api` (when accessed via Nginx reverse proxy)
**Backend Direct URL:** `http://localhost:8080` (for direct access during development/testing, or when bypassing Nginx)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header, formatted as `Bearer <token>`.
API Key authentication (`X-API-KEY` header) is used for metric ingestion by monitored services.

### 1. Authentication Endpoints

#### `POST /auth/login`
Authenticates a user and returns a JWT.

*   **Request Body (JSON):**
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```
*   **Response (200 OK - JSON):**
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "username": "admin",
        "role": "admin"
    }
    ```
*   **Response (401 Unauthorized - JSON):**
    ```json
    {
        "error": "Invalid username or password."
    }
    ```

### 2. Service Management Endpoints

#### `POST /services`
**Description:** Registers a new service to be monitored. Requires `admin` role.
**Authentication:** JWT (Bearer Token)
*   **Request Body (JSON):**
    ```json
    {
        "name": "My New WebApp",
        "description": "Critical web application for customers."
    }
    ```
*   **Response (201 Created - JSON):**
    ```json
    {
        "id": 4,
        "name": "My New WebApp",
        "description": "Critical web application for customers.",
        "api_key": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
*   **Response (403 Forbidden - JSON):**
    ```json
    {
        "error": "Access denied. Admin role required."
    }
    ```
*   **Response (409 Conflict - JSON):**
    ```json
    {
        "error": "Service with this name already exists."
    }
    ```

#### `GET /services`
**Description:** Retrieves a list of all registered services. Accessible by `admin` and `viewer` roles.
**Authentication:** JWT (Bearer Token)
*   **Query Parameters:** None
*   **Response (200 OK - JSON Array):**
    ```json
    [
        {
            "id": 1,
            "name": "WebApp Service 1",
            "description": "Main customer-facing web application backend.",
            "api_key": "b2e6a7c3-d8f9-4a0b-9c1d-2e3f4a5b6c7d"
        },
        {
            "id": 2,
            "name": "Payment Gateway",
            "description": "Critical service for processing payments.",
            "api_key": "c3d4e5f6-a7b8-1c2d-3e4f-5a6b7c8d9e0f"
        }
    ]
    ```

### 3. Metric Ingestion Endpoints

#### `POST /metrics`
**Description:** Ingests performance metrics for a service.
**Authentication:** API Key (via `X-API-KEY` header)
*   **Request Headers:**
    *   `X-API-KEY`: The unique API key for the service.
    *   `Content-Type`: `application/json`
*   **Request Body (JSON - Single Metric):**
    ```json
    {
        "metric_type": "CPU_USAGE",
        "value": 0.75,
        "tags": {
            "host": "server-01",
            "region": "us-east-1"
        }
    }
    ```
*   **Request Body (JSON - Batch Metrics):**
    ```json
    {
        "metrics": [
            {
                "metric_type": "MEMORY_USAGE",
                "value": 0.5,
                "tags": { "host": "server-01" }
            },
            {
                "metric_type": "REQUEST_LATENCY",
                "value": 120.5,
                "tags": { "endpoint": "/api/users", "method": "GET" }
            }
        ]
    }
    ```
    **Supported `metric_type` values:** `CPU_USAGE`, `MEMORY_USAGE`, `REQUEST_LATENCY`, `ERROR_RATE`, `CUSTOM_METRIC`.
*   **Response (202 Accepted - JSON):**
    ```json
    {
        "message": "Metrics ingested successfully."
    }
    ```
*   **Response (400 Bad Request - JSON):**
    ```json
    {
        "error": "X-API-KEY header is required for metric ingestion."
    }
    ```
    ```json
    {
        "error": "Invalid JSON format for metrics."
    }
    ```
    ```json
    {
        "error": "Invalid metric type: UNKNOWN_TYPE"
    }
    ```
*   **Response (403 Forbidden - JSON):**
    ```json
    {
        "error": "Invalid X-API-KEY."
    }
    ```
*   **Response (429 Too Many Requests - JSON):**
    ```json
    {
        "error": "Rate limit exceeded. Please try again later."
    }
    ```
    **Headers:** `Retry-After: <seconds>`

### 4. Metric Query Endpoints

#### `GET /metrics/{service_id}`
**Description:** Retrieves historical performance metrics for a specific service. Accessible by `admin` and `viewer` roles.
**Authentication:** JWT (Bearer Token)
*   **Path Parameters:**
    *   `service_id` (integer): The ID of the service to query.
*   **Query Parameters:**
    *   `metric_type` (string, optional): Filter by a specific metric type (e.g., `CPU_USAGE`).
    *   `start_time` (string, optional): ISO 8601 formatted timestamp (e.g., `2023-01-01T00:00:00Z`).
    *   `end_time` (string, optional): ISO 8601 formatted timestamp.
    *   `limit` (integer, optional): Maximum number of records to return (default: 100).
    *   `offset` (integer, optional): Number of records to skip (default: 0).
*   **Response (200 OK - JSON Array):**
    ```json
    [
        {
            "id": 101,
            "service_id": 1,
            "timestamp": "2023-10-27T10:30:00Z",
            "metric_type": "CPU_USAGE",
            "value": 0.85,
            "tags": {
                "host": "server-01"
            }
        },
        {
            "id": 102,
            "service_id": 1,
            "timestamp": "2023-10-27T10:25:00Z",
            "metric_type": "REQUEST_LATENCY",
            "value": 150.2,
            "tags": {
                "endpoint": "/api/dashboard"
            }
        }
    ]
    ```
*   **Response (400 Bad Request - JSON):**
    ```json
    {
        "error": "Invalid query parameter format: Invalid start_time format."
    }
    ```
*   **Response (404 Not Found - JSON):**
    ```json
    {
        "error": "Service not found."
    }
    ```
*   **Response (401 Unauthorized - JSON):**
    ```json
    {
        "error": "Authentication token required."
    }
    ```

### 5. Alerting Endpoints (Planned/Future)

These endpoints are designed but not fully implemented in the provided C++ backend example.

#### `POST /alerts/rules`
**Description:** Creates a new alert rule. Requires `admin` role.
**Authentication:** JWT (Bearer Token)
*   **Request Body (JSON):**
    ```json
    {
        "service_id": 1,                // Optional, can be null for global rules
        "name": "High CPU Alert",
        "metric_type": "CPU_USAGE",
        "threshold": 0.90,              // 90%
        "operator": ">",
        "duration_seconds": 300,        // Threshold must be violated for 5 minutes
        "target_email": "ops@example.com"
    }
    ```
*   **Response (201 Created - JSON):**
    ```json
    {
        "id": 1,
        "name": "High CPU Alert",
        "status": "active"
    }
    ```

#### `GET /alerts/rules`
**Description:** Retrieves all alert rules or rules for a specific service.
**Authentication:** JWT (Bearer Token)
*   **Query Parameters:**
    *   `service_id` (integer, optional): Filter rules by service.
*   **Response (200 OK - JSON Array):**
    ```json
    [
        {
            "id": 1,
            "service_id": 1,
            "name": "High CPU Alert",
            "metric_type": "CPU_USAGE",
            "threshold": 0.90,
            "operator": ">",
            "duration_seconds": 300,
            "status": "active",
            "target_email": "ops@example.com",
            "created_at": "2023-10-27T10:00:00Z"
        }
    ]
    ```

#### `PUT /alerts/rules/{rule_id}`
**Description:** Updates an existing alert rule. Requires `admin` role.
**Authentication:** JWT (Bearer Token)
*   **Path Parameters:**
    *   `rule_id` (integer): The ID of the rule to update.
*   **Request Body (JSON):** (Partial updates allowed)
    ```json
    {
        "status": "inactive",
        "threshold": 0.95
    }
    ```
*   **Response (200 OK - JSON):** (Updated rule details)
*   **Response (404 Not Found - JSON):**

#### `DELETE /alerts/rules/{rule_id}`
**Description:** Deletes an alert rule. Requires `admin` role.
**Authentication:** JWT (Bearer Token)
*   **Path Parameters:**
    *   `rule_id` (integer): The ID of the rule to delete.
*   **Response (204 No Content):**
*   **Response (404 Not Found - JSON):**

---
```