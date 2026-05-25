# API Documentation

This document outlines the RESTful API endpoints for the ML Utilities Hub backend. All endpoints are prefixed with `/api/v1`.

---

## Authentication

### `POST /api/v1/auth/register`
Registers a new user.

*   **Request Body**:
    ```json
    {
        "email": "user@example.com",
        "password": "strongpassword123",
        "firstName": "John",
        "lastName": "Doe"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "createdAt": "ISOString",
            "updatedAt": "ISOString"
        },
        "token": "jwt_token_string"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: If `email` is already taken or required fields are missing.

### `POST /api/v1/auth/login`
Authenticates a user and returns a JWT token.

*   **Request Body**:
    ```json
    {
        "email": "user@example.com",
        "password": "strongpassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe",
            "createdAt": "ISOString",
            "updatedAt": "ISOString"
        },
        "token": "jwt_token_string"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: For incorrect email or password.

---

## User Management

### `GET /api/v1/users/me`
Retrieves the profile of the authenticated user.
This endpoint is cached for 5 minutes.

*   **Authentication**: Required (Bearer Token)
*   **Response (200 OK)**:
    ```json
    {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "createdAt": "ISOString",
        "updatedAt": "ISOString"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no valid token is provided.

---

## Dataset Management

All dataset endpoints require authentication.

### `POST /api/v1/datasets`
Creates a new dataset entry.

*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
        "name": "Customer Churn Data",
        "description": "Dataset containing customer churn information for predictive modeling.",
        "filePath": "s3://my-data-bucket/customer_churn.csv",
        "fileSizeBytes": 152400,
        "mimeType": "text/csv"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
        "id": "uuid",
        "userId": "uuid",
        "name": "Customer Churn Data",
        "description": "Dataset containing customer churn information for predictive modeling.",
        "filePath": "s3://my-data-bucket/customer_churn.csv",
        "fileSizeBytes": 152400,
        "mimeType": "text/csv",
        "uploadedAt": "ISOString",
        "createdAt": "ISOString",
        "updatedAt": "ISOString"
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: If `name` or `filePath` are missing.
    *   `401 Unauthorized`: If no valid token.

### `GET /api/v1/datasets`
Retrieves all datasets owned by the authenticated user.
This endpoint is cached for 1 hour by default.

*   **Authentication**: Required
*   **Response (200 OK)**:
    ```json
    [
        {
            "id": "uuid",
            "userId": "uuid",
            "name": "Customer Churn Data",
            "description": "...",
            "filePath": "...",
            "fileSizeBytes": 152400,
            "mimeType": "text/csv",
            "uploadedAt": "ISOString",
            "createdAt": "ISOString",
            "updatedAt": "ISOString"
        },
        // ... more datasets
    ]
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no valid token.

### `GET /api/v1/datasets/:id`
Retrieves a specific dataset by its ID.
This endpoint is cached for 1 hour by default.

*   **Authentication**: Required
*   **Path Parameters**:
    *   `id` (string, UUID): The ID of the dataset.
*   **Response (200 OK)**:
    ```json
    {
        "id": "uuid",
        "userId": "uuid",
        "name": "Customer Churn Data",
        "description": "...",
        "filePath": "...",
        "fileSizeBytes": 152400,
        "mimeType": "text/csv",
        "uploadedAt": "ISOString",
        "createdAt": "ISOString",
        "updatedAt": "ISOString"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no valid token.
    *   `404 Not Found`: If the dataset with the given ID does not exist or does not belong to the authenticated user.

### `PATCH /api/v1/datasets/:id`
Updates an existing dataset's metadata.

*   **Authentication**: Required
*   **Path Parameters**:
    *   `id` (string, UUID): The ID of the dataset.
*   **Request Body (Partial Update)**:
    ```json
    {
        "name": "Updated Customer Data",
        "description": "Improved description."
    }
    ```
*   **Response (200 OK)**: Returns the updated dataset object.
*   **Error Responses**:
    *   `401 Unauthorized`: If no valid token.
    *   `404 Not Found`: If the dataset with the given ID does not exist or does not belong to the authenticated user.

### `DELETE /api/v1/datasets/:id`
Deletes a dataset.

*   **Authentication**: Required
*   **Path Parameters**:
    *   `id` (string, UUID): The ID of the dataset.
*   **Response (204 No Content)**:
*   **Error Responses**:
    *   `401 Unauthorized`: If no valid token.
    *   `404 Not Found`: If the dataset with the given ID does not exist or does not belong to the authenticated user.

---

## Data Utilities

All data utility endpoints require authentication. They expect a JSON array of objects as input and return a transformed JSON array. These endpoints are generally not cached as their output is dynamic based on input.

### `POST /api/v1/data-utilities/encode/one-hot`
Applies One-Hot Encoding to a specified categorical column in the input data.

*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
        "data": [
            { "id": 1, "color": "red", "value": 10 },
            { "id": 2, "color": "blue", "value": 20 },
            { "id": 3, "color": "red", "value": 15 }
        ],
        "column": "color"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
        "originalData": [...],
        "encodedData": [
            { "id": 1, "value": 10, "color_red": 1, "color_blue": 0 },
            { "id": 2, "value": 20, "color_red": 0, "color_blue": 1 },
            { "id": 3, "value": 15, "color_red": 1, "color_blue": 0 }
        ]
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: If `data` is not a non-empty array or `column` is missing/invalid.
    *   `401 Unauthorized`: If no valid token.

### `POST /api/v1/data-utilities/scale/min-max`
Applies Min-Max Scaling to a specified numerical column in the input data.

*   **Authentication**: Required
*   **Request Body**:
    ```json
    {
        "data": [
            { "id": 1, "feature": 10, "label": "A" },
            { "id": 2, "feature": 20, "label": "B" },
            { "id": 3, "feature": 5, "label": "C" }
        ],
        "column": "feature"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
        "originalData": [...],
        "scaledData": [
            { "id": 1, "label": "A", "feature_scaled": 0.3333333333333333 },
            { "id": 2, "label": "B", "feature_scaled": 1 },
            { "id": 3, "label": "C", "feature_scaled": 0 }
        ]
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: If `data` is not a non-empty array, `column` is missing/invalid, or the column contains no numeric values for scaling.
    *   `401 Unauthorized`: If no valid token.

---