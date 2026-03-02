```markdown
# ML Utilities System API Documentation

This document provides an overview of the RESTful API endpoints for the ML Utilities System. For an interactive exploration, please refer to the [Swagger UI](#swagger-ui).

## Base URL

`http://localhost:8080/api` (for local development)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token.
Example: `Authorization: Bearer <YOUR_JWT_TOKEN>`

### Authentication Endpoints

*   **`POST /api/auth/signup`**
    *   **Description:** Registers a new user with `ROLE_USER`.
    *   **Request Body:** `application/json`
        ```json
        {
          "name": "string",
          "username": "string",
          "email": "user@example.com",
          "password": "string"
        }
        ```
    *   **Responses:**
        *   `201 Created`: User registered successfully (body: `"User registered successfully"`)
        *   `400 Bad Request`: Validation error (e.g., username/email already taken, invalid format)

*   **`POST /api/auth/signin`**
    *   **Description:** Authenticates a user and returns a JWT token.
    *   **Request Body:** `application/json`
        ```json
        {
          "usernameOrEmail": "string",
          "password": "string"
        }
        ```
    *   **Responses:**
        *   `200 OK`: Successful authentication.
            ```json
            {
              "accessToken": "eyJhbGciOiJIUzUxMi...",
              "tokenType": "Bearer"
            }
            ```
        *   `401 Unauthorized`: Invalid credentials.

## Model Management Endpoints (`/api/models`)

Requires `BearerAuth` (JWT Token).
*   `ROLE_ADMIN` for POST, PUT, DELETE, and activating versions.
*   `ROLE_ADMIN`, `ROLE_USER` for GET operations.

### Model CRUD

*   **`POST /api/models`**
    *   **Description:** Register a new ML model.
    *   **Roles:** `ADMIN`
    *   **Request Body:** `application/json`
        ```json
        {
          "name": "string",
          "description": "string"
        }
        ```
    *   **Responses:** `201 Created` (ModelDto), `400 Bad Request`

*   **`GET /api/models`**
    *   **Description:** Get all registered models with pagination.
    *   **Roles:** `ADMIN`, `USER`
    *   **Query Params:** `page` (default 0), `size` (default 10), `sort` (e.g., `name,asc`)
    *   **Responses:** `200 OK` (Page<ModelDto>)

*   **`GET /api/models/{id}`**
    *   **Description:** Get a model by its ID.
    *   **Roles:** `ADMIN`, `USER`
    *   **Path Params:** `{id}` (Long)
    *   **Responses:** `200 OK` (ModelDto), `404 Not Found`

*   **`PUT /api/models/{id}`**
    *   **Description:** Update an existing model.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{id}` (Long)
    *   **Request Body:** `application/json` (same as POST)
    *   **Responses:** `200 OK` (ModelDto), `400 Bad Request`, `404 Not Found`

*   **`DELETE /api/models/{id}`**
    *   **Description:** Delete a model by its ID.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{id}` (Long)
    *   **Responses:** `204 No Content`, `404 Not Found`

### Model Version Management

*   **`POST /api/models/{modelId}/versions`**
    *   **Description:** Upload a new version for an existing model. The new version automatically becomes `active`.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{modelId}` (Long)
    *   **Request Body:** `application/json`
        ```json
        {
          "modelPath": "string",    // e.g., "s3://my-bucket/models/churn_v3.onnx"
          "fileName": "string",     // e.g., "churn_v3.onnx"
          "fileType": "string",     // e.g., "ONNX", "PMML", "PICKLE"
          "metadata": "{}"          // JSON string for additional metadata
        }
        ```
    *   **Responses:** `201 Created` (ModelVersionDto), `400 Bad Request`, `404 Not Found`

*   **`GET /api/models/{modelId}/versions`**
    *   **Description:** Get all versions for a specific model, ordered by version number descending.
    *   **Roles:** `ADMIN`, `USER`
    *   **Path Params:** `{modelId}` (Long)
    *   **Responses:** `200 OK` (List<ModelVersionDto>), `404 Not Found`

*   **`GET /api/models/{modelId}/versions/{versionNumber}`**
    *   **Description:** Get a specific model version by model ID and version number.
    *   **Roles:** `ADMIN`, `USER`
    *   **Path Params:** `{modelId}` (Long), `{versionNumber}` (Integer)
    *   **Responses:** `200 OK` (ModelVersionDto), `404 Not Found`

*   **`PUT /api/models/{modelId}/versions/{versionNumber}/activate`**
    *   **Description:** Activate a specific model version. This will deactivate any previously active version for this model.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{modelId}` (Long), `{versionNumber}` (Integer)
    *   **Responses:** `200 OK` (ModelVersionDto), `404 Not Found`

*   **`GET /api/models/{modelId}/versions/active`**
    *   **Description:** Get the currently active model version for a given model ID.
    *   **Roles:** `ADMIN`, `USER`
    *   **Path Params:** `{modelId}` (Long)
    *   **Responses:** `200 OK` (ModelVersionDto), `404 Not Found`

## Prediction Service Endpoints (`/api/predictions`)

*   **`POST /api/predictions/{modelId}`**
    *   **Description:** Make a prediction using the active version of a specified model. Logs the request and response.
    *   **Roles:** `PUBLIC` (No authentication required, but can be provided by user token)
    *   **Path Params:** `{modelId}` (Long)
    *   **Request Body:** `application/json`
        ```json
        {
          "inputData": {}  // Flexible JSON object or array representing input features
        }
        ```
    *   **Responses:**
        *   `200 OK`: Prediction successful.
            ```json
            {
              "modelName": "string",
              "modelVersion": 0,
              "prediction": {}, // Flexible JSON object/array
              "latencyMs": 0
            }
            ```
        *   `400 Bad Request`: Invalid input.
        *   `404 Not Found`: Model not found or no active version.
        *   `429 Too Many Requests`: Rate limit exceeded.

### Prediction Logging (Admin only)

*   **`GET /api/predictions/logs/{logId}`**
    *   **Description:** Get a specific prediction log entry by ID.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{logId}` (Long)
    *   **Responses:** `200 OK` (PredictionLog), `404 Not Found`

*   **`GET /api/predictions/logs/model/{modelId}`**
    *   **Description:** Get all prediction logs for a specific model.
    *   **Roles:** `ADMIN`
    *   **Path Params:** `{modelId}` (Long)
    *   **Responses:** `200 OK` (List<PredictionLog>), `404 Not Found`

## Data Processing Endpoints (`/api/data-processing`)

Requires `BearerAuth` (JWT Token).
*   `ROLE_ADMIN`, `ROLE_USER`

*   **`POST /api/data-processing/process`**
    *   **Description:** Apply a specified data processing transformation to input data.
    *   **Roles:** `ADMIN`, `USER`
    *   **Request Body:** `application/json`
        ```json
        {
          "inputData": {},         // Flexible JSON object or array of data to process
          "processingType": "string", // e.g., "MIN_MAX_SCALER", "ONE_HOT_ENCODER", "TEXT_VECTORIZER"
          "params": {}             // Optional parameters for the processing type (e.g., {"feature": "category_col"})
        }
        ```
    *   **Responses:**
        *   `200 OK`: Data processed successfully.
            ```json
            {
              "processingType": "string",
              "processedData": {}, // Flexible JSON object or array
              "message": "string"
            }
            ```
        *   `400 Bad Request`: Invalid input or unsupported processing type.

---
### Data Transfer Objects (DTOs)

This section provides outlines of the DTOs used in the API. Refer to the Swagger UI for complete schema details.

#### ModelDto
```json
{
  "id": 0,
  "name": "string",
  "description": "string",
  "owner": "string",
  "createdAt": "2023-01-01T12:00:00",
  "updatedAt": "2023-01-01T12:00:00",
  "versions": [
    // List of ModelVersionDto (optional, only included in detailed model view)
  ]
}
```

#### ModelVersionDto
```json
{
  "id": 0,
  "modelId": 0,
  "versionNumber": 0,
  "modelPath": "string",
  "fileName": "string",
  "fileType": "string",
  "status": "string",
  "metadata": "{}", // JSON string
  "uploadedAt": "2023-01-01T12:00:00",
  "isActive": true
}
```

#### PredictionLog
```json
{
  "id": 0,
  "modelId": 0,
  "modelVersionNumber": 0,
  "requestPayload": "{}", // JSON string
  "responsePayload": "{}", // JSON string
  "userId": "string",
  "clientIp": "string",
  "predictedAt": "2023-01-01T12:00:00",
  "latencyMs": 0
}
```

#### ApiErrorResponse (Common Error Structure)
```json
{
  "timestamp": "2023-01-01T12:00:00.000000",
  "status": "BAD_REQUEST",
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error message",
  "path": "/api/endpoint"
}
```

---
### Swagger UI

Access the interactive API documentation at `http://localhost:8080/swagger-ui.html`.
This interface automatically generated from the Spring Boot application's code annotations (`@Operation`, `@Tag`, `@ApiResponse`, etc.) using SpringDoc OpenAPI. It allows you to:
*   View all available API endpoints.
*   Understand request and response schemas.
*   Test API calls directly from your browser after authenticating with a JWT token.
```