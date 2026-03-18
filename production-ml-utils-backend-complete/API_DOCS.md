# ML Utilities System - API Documentation

This document describes the RESTful API endpoints exposed by the C++ backend.
The base URL for all API endpoints is `/api/v1`.

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a `Bearer` token.

`Authorization: Bearer <YOUR_JWT_TOKEN>`

### 1. User Authentication

#### `POST /auth/register`
Registers a new user.
*   **Request Body**:
    ```json
    {
      "username": "string",
      "email": "string (email format)",
      "password": "string (min 6 characters)"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "token": "string (JWT)",
        "user": {
          "id": "string (UUID)",
          "username": "string",
          "email": "string",
          "created_at": "string (datetime)",
          "updated_at": "string (datetime)"
        }
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing fields, invalid format, password too short.
    *   `400 Bad Request`: User with email already exists.
    *   `500 Internal Server Error`: Database error.

#### `POST /auth/login`
Authenticates an existing user and returns a JWT.
*   **Request Body**:
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "token": "string (JWT)",
        "user": {
          "id": "string (UUID)",
          "username": "string",
          "email": "string",
          "created_at": "string (datetime)",
          "updated_at": "string (datetime)"
        }
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing fields.
    *   `401 Unauthorized`: Invalid credentials.
    *   `500 Internal Server Error`: Database error.

### 2. User Profile

#### `GET /users/me`
Retrieves the profile of the authenticated user.
*   **Authentication**: Required
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "string (UUID)",
        "username": "string",
        "email": "string",
        "created_at": "string (datetime)",
        "updated_at": "string (datetime)"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: User not found (shouldn't happen with valid token).
    *   `500 Internal Server Error`: Database error.

### 3. Model Management

#### `POST /models`
Registers a new ML model.
*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
      "name": "string (required)",
      "description": "string (required)",
      "version": "string (optional, default: '1.0.0')",
      "model_path": "string (optional, e.g., S3 URL or local file path)",
      "status": "string (optional, enum: 'draft', 'training', 'ready', 'deployed', 'archived', default: 'draft')",
      "metadata": "object (optional, arbitrary JSON for additional details)"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "string (UUID)",
        "user_id": "string (UUID)",
        "name": "string",
        "description": "string",
        "version": "string",
        "model_path": "string",
        "status": "string",
        "metadata": {},
        "created_at": "string (datetime)",
        "updated_at": "string (datetime)"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Missing required fields, invalid input, model with name already exists for user.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Database error.

#### `GET /models`
Lists all ML models owned by the authenticated user.
*   **Authentication**: Required
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "string (UUID)",
          "user_id": "string (UUID)",
          "name": "string",
          "description": "string",
          "version": "string",
          "model_path": "string",
          "status": "string",
          "metadata": {},
          "created_at": "string (datetime)",
          "updated_at": "string (datetime)"
        },
        // ... more models
      ]
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Database error.

#### `GET /models/{model_id}`
Retrieves details for a specific ML model by its ID.
*   **Authentication**: Required
*   **Path Parameters**:
    *   `model_id`: `string` (UUID) - The ID of the model.
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "string (UUID)",
        "user_id": "string (UUID)",
        "name": "string",
        "description": "string",
        "version": "string",
        "model_path": "string",
        "status": "string",
        "metadata": {},
        "created_at": "string (datetime)",
        "updated_at": "string (datetime)"
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Model not found or not owned by the user.
    *   `500 Internal Server Error`: Database error.

#### `PUT /models/{model_id}`
Updates details for a specific ML model.
*   **Authentication**: Required
*   **Path Parameters**:
    *   `model_id`: `string` (UUID) - The ID of the model to update.
*   **Request Body**:
    ```json
    {
      "name": "string (optional)",
      "description": "string (optional)",
      "version": "string (optional)",
      "model_path": "string (optional)",
      "status": "string (optional, enum: 'draft', 'training', 'ready', 'deployed', 'archived')",
      "metadata": "object (optional, arbitrary JSON, will overwrite existing metadata)"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "string (UUID)",
        "user_id": "string (UUID)",
        "name": "string (updated)",
        "description": "string (updated)",
        "version": "string (updated)",
        "model_path": "string (updated)",
        "status": "string (updated)",
        "metadata": {},
        "created_at": "string (datetime)",
        "updated_at": "string (datetime)"
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: No fields provided for update, invalid metadata JSON.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Model not found or not owned by the user.
    *   `500 Internal Server Error`: Database error.

#### `DELETE /models/{model_id}`
Deletes a specific ML model.
*   **Authentication**: Required
*   **Path Parameters**:
    *   `model_id`: `string` (UUID) - The ID of the model to delete.
*   **Success Response (204 No Content)**:
    ```json
    {
      "status": "success",
      "data": {
        "message": "Model deleted successfully."
      }
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Model not found or not owned by the user.
    *   `500 Internal Server Error`: Database error.

### 4. ML Data Transformations

These endpoints apply common data scaling techniques.
*   **Authentication**: Required
*   **Request Body for all transformations**:
    ```json
    {
      "features": [
        [double, double, ...], // Row 1 of data
        [double, double, ...], // Row 2 of data
        // ... more rows
      ],
      "feature_names": ["string", "string", ...] // Optional: names for each feature/column
    }
    ```
*   **Success Response for all transformations (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "features": [
          [double, double, ...], // Transformed row 1
          // ... more transformed rows
        ],
        "feature_names": ["string", "string", ...] // (Optional, if provided in request)
      }
    }
    ```
*   **Error Responses for all transformations**:
    *   `400 Bad Request`: Invalid input JSON, empty features array, mismatched feature_names count.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Unexpected server error during transformation.

#### `POST /transforms/standard_scaler`
Applies StandardScaler transformation to the input features.
*   **Input**: JSON 2D array of numeric features.
*   **Output**: JSON 2D array of scaled features (mean 0, std dev 1).

#### `POST /transforms/minmax_scaler`
Applies MinMaxScaler transformation to the input features.
*   **Input**: JSON 2D array of numeric features.
*   **Output**: JSON 2D array of scaled features (values between 0 and 1).

### 5. Mock Prediction

#### `POST /predict/{model_id}`
Provides a mock prediction for a given model ID and input features.
*   **Authentication**: Required
*   **Path Parameters**:
    *   `model_id`: `string` (UUID) - The ID of the model to predict with.
*   **Request Body**:
    ```json
    {
      "feature_1": "value",
      "feature_2": "value",
      // ... arbitrary key-value pairs representing input features
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "model_id": "string (UUID)",
        "input_features": {}, // The features sent in the request
        "prediction": "string or number", // Mock prediction value
        "probability": "double (optional)",
        "score": "double (optional)",
        // ... other mock prediction details based on model_id
      }
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: Invalid input JSON.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Model ID not found.
    *   `500 Internal Server Error`: Unexpected server error during prediction.

---
```