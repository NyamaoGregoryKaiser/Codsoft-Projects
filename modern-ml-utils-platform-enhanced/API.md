```markdown
# MLOps Core Service API Documentation

This document provides a comprehensive overview of the RESTful API endpoints exposed by the MLOps Core Service. All endpoints are protected by JWT authentication and enforce role-based authorization.

**Base URL**: `http://localhost:18080` (or your configured service URL)
**Content-Type**: `application/json` for all request and response bodies.

---

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header.

**Header**: `Authorization: Bearer <YOUR_JWT_TOKEN>`

**Roles**:
*   `admin`: Full CRUD access to models, versions, and prediction logs. Can serve predictions.
*   `predictor`: Can only serve predictions.
*   `viewer`: Read-only access to models, versions, and prediction logs. Can serve predictions.

**Token Generation**:
You can use the `scripts/generate_jwt.py` utility to generate tokens:
```bash
python scripts/generate_jwt.py --user_id 1 --role admin --secret "your_secret_key"
```

---

## 1. Health Check

**Endpoint**: `/health_check`
**Method**: `GET`
**Authentication**: None
**Description**: Checks if the service is running and responsive.

**Response (200 OK)**:
```json
{
  "status": "ok"
}
```

---

## 2. Models Management (`/api/v1/models`)

Manages the registration and metadata of machine learning models.

### 2.1. Create a New Model

**Endpoint**: `/api/v1/models`
**Method**: `POST`
**Authentication**: Required (`admin` role)
**Description**: Registers a new model in the system. Model names must be unique.

**Request Body**:
```json
{
  "name": "MyNewModel",
  "description": "A detailed description of what this model does."
}
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "name": "MyNewModel",
  "description": "A detailed description of what this model does.",
  "created_at": "2023-10-27T10:30:00Z",
  "updated_at": "2023-10-27T10:30:00Z"
}
```

**Error Responses**:
*   `400 Bad Request`: Invalid or missing fields in request body.
*   `401 Unauthorized`: No valid JWT token.
*   `403 Forbidden`: User does not have `admin` role.
*   `409 Conflict`: Model with the given name already exists.

### 2.2. Get All Models

**Endpoint**: `/api/v1/models`
**Method**: `GET`
**Authentication**: Required (`viewer` or `admin` role)
**Description**: Retrieves a list of all registered models.

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "MyNewModel",
    "description": "A detailed description of what this model does.",
    "created_at": "2023-10-27T10:30:00Z",
    "updated_at": "2023-10-27T10:30:00Z"
  },
  {
    "id": 2,
    "name": "AnotherModel",
    "description": "Description of another model.",
    "created_at": "2023-10-26T09:00:00Z",
    "updated_at": "2023-10-26T09:00:00Z"
  }
]
```

### 2.3. Get Model by ID

**Endpoint**: `/api/v1/models/{model_id}`
**Method**: `GET`
**Authentication**: Required (`viewer` or `admin` role)
**Description**: Retrieves details for a specific model by its ID.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the model.

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "MyNewModel",
  "description": "A detailed description of what this model does.",
  "created_at": "2023-10-27T10:30:00Z",
  "updated_at": "2023-10-27T10:30:00Z"
}
```

**Error Responses**:
*   `404 Not Found`: Model with the specified `model_id` does not exist.

### 2.4. Update Model

**Endpoint**: `/api/v1/models/{model_id}`
**Method**: `PUT`
**Authentication**: Required (`admin` role)
**Description**: Updates the metadata for an existing model.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the model to update.

**Request Body**:
```json
{
  "name": "MyUpdatedModelName",
  "description": "An updated description for the model."
}
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "MyUpdatedModelName",
  "description": "An updated description for the model.",
  "created_at": "2023-10-27T10:30:00Z",
  "updated_at": "2023-10-27T11:00:00Z"
}
```

**Error Responses**:
*   `404 Not Found`: Model with the specified `model_id` does not exist.
*   `409 Conflict`: New model name already exists.

### 2.5. Delete Model

**Endpoint**: `/api/v1/models/{model_id}`
**Method**: `DELETE`
**Authentication**: Required (`admin` role)
**Description**: Deletes a model and all its associated versions and prediction logs.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the model to delete.

**Response (204 No Content)**:
*   No body, successful deletion.

**Error Responses**:
*   `404 Not Found`: Model with the specified `model_id` does not exist.

---

## 3. Model Versions Management (`/api/v1/models/{model_id}/versions`)

Manages different versions of a specific machine learning model.

### 3.1. Create a New Model Version

**Endpoint**: `/api/v1/models/{model_id}/versions`
**Method**: `POST`
**Authentication**: Required (`admin` role)
**Description**: Registers a new version for a specific model. If `is_active` is true, all other versions of this model will be deactivated.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.

**Request Body**:
```json
{
  "version_tag": "v1.0.0",
  "model_path": "./models/mymodel/v1.0.0/model.json",
  "is_active": true,
  "parameters": {
    "intercept": 0.5,
    "coef_feature1": 1.2,
    "coef_feature2": -0.8
  },
  "notes": "Initial stable release, trained on Q3 data."
}
```
*   `parameters`: A JSON object representing the model's internal parameters. For a dummy linear regression model, these might be coefficients and an intercept.
*   `model_path`: A string pointing to the actual serialized model file or directory. This is used by the prediction service to load the model.

**Response (201 Created)**:
```json
{
  "id": 101,
  "model_id": 1,
  "version_tag": "v1.0.0",
  "model_path": "./models/mymodel/v1.0.0/model.json",
  "created_at": "2023-10-27T11:15:00Z",
  "is_active": true,
  "parameters": {
    "intercept": 0.5,
    "coef_feature1": 1.2,
    "coef_feature2": -0.8
  },
  "notes": "Initial stable release, trained on Q3 data."
}
```

**Error Responses**:
*   `404 Not Found`: Parent model with `model_id` does not exist.
*   `409 Conflict`: A version with the same `version_tag` already exists for this model.

### 3.2. Get All Model Versions for a Model

**Endpoint**: `/api/v1/models/{model_id}/versions`
**Method**: `GET`
**Authentication**: Required (`viewer` or `admin` role)
**Description**: Retrieves a list of all versions for a specific model.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.

**Response (200 OK)**:
```json
[
  {
    "id": 101,
    "model_id": 1,
    "version_tag": "v1.0.0",
    "model_path": "./models/mymodel/v1.0.0/model.json",
    "created_at": "2023-10-27T11:15:00Z",
    "is_active": true,
    "parameters": { ... },
    "notes": "Initial stable release, trained on Q3 data."
  },
  {
    "id": 102,
    "model_id": 1,
    "version_tag": "v1.1.0-experiment",
    "model_path": "./models/mymodel/v1.1.0/model.json",
    "created_at": "2023-10-27T12:00:00Z",
    "is_active": false,
    "parameters": { ... },
    "notes": "Experimental version with new features."
  }
]
```

### 3.3. Get Model Version by ID

**Endpoint**: `/api/v1/models/{model_id}/versions/{version_id}`
**Method**: `GET`
**Authentication**: Required (`viewer` or `admin` role)
**Description**: Retrieves details for a specific model version by its ID.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_id` (integer, required): The ID of the model version.

**Response (200 OK)**:
```json
{
  "id": 101,
  "model_id": 1,
  "version_tag": "v1.0.0",
  "model_path": "./models/mymodel/v1.0.0/model.json",
  "created_at": "2023-10-27T11:15:00Z",
  "is_active": true,
  "parameters": {
    "intercept": 0.5,
    "coef_feature1": 1.2,
    "coef_feature2": -0.8
  },
  "notes": "Initial stable release, trained on Q3 data."
}
```

**Error Responses**:
*   `404 Not Found`: Model or model version with the specified IDs does not exist, or the version does not belong to the specified model.

### 3.4. Update Model Version

**Endpoint**: `/api/v1/models/{model_id}/versions/{version_id}`
**Method**: `PUT`
**Authentication**: Required (`admin` role)
**Description**: Updates the metadata for an existing model version. If `is_active` is set to `true`, other versions of the same model will be deactivated.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_id` (integer, required): The ID of the model version to update.

**Request Body**:
```json
{
  "is_active": false,
  "notes": "Deactivating this version due to performance issues.",
  "parameters": {
    "intercept": 0.6,
    "coef_feature1": 1.3
  }
}
```
You can update `version_tag`, `model_path`, `is_active`, `parameters`, `notes`.

**Response (200 OK)**:
```json
{
  "id": 101,
  "model_id": 1,
  "version_tag": "v1.0.0",
  "model_path": "./models/mymodel/v1.0.0/model.json",
  "created_at": "2023-10-27T11:15:00Z",
  "is_active": false,
  "parameters": {
    "intercept": 0.6,
    "coef_feature1": 1.3
  },
  "notes": "Deactivating this version due to performance issues."
}
```

**Error Responses**:
*   `404 Not Found`: Model or model version with the specified IDs does not exist, or the version does not belong to the specified model.
*   `409 Conflict`: New `version_tag` already exists for this model.

### 3.5. Delete Model Version

**Endpoint**: `/api/v1/models/{model_id}/versions/{version_id}`
**Method**: `DELETE`
**Authentication**: Required (`admin` role)
**Description**: Deletes a specific model version and its associated prediction logs.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_id` (integer, required): The ID of the model version to delete.

**Response (204 No Content)**:
*   No body, successful deletion.

**Error Responses**:
*   `404 Not Found`: Model or model version with the specified IDs does not exist, or the version does not belong to the specified model.

---

## 4. Prediction Service (`/api/v1/predict`)

Serves predictions from registered and active model versions.

### 4.1. Serve Prediction by Version ID

**Endpoint**: `/api/v1/predict/{model_id}/{version_id}`
**Method**: `POST`
**Authentication**: Required (`predictor` or `admin` role)
**Description**: Requests a prediction from a specific model version by its ID. The version must be active.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_id` (integer, required): The ID of the model version to use for prediction.

**Request Body**:
```json
{
  "feature1": 10.5,
  "feature2": 2.0,
  "featureX": 50.0
}
```
*   The structure of the input data depends on the model's expected features.

**Response (200 OK)**:
```json
{
  "predicted_value": 150.75
}
```
*   The structure of the output data depends on the model's output. For the dummy linear regression, it's `predicted_value`.

**Error Responses**:
*   `400 Bad Request`: Invalid JSON in request body or missing expected features.
*   `404 Not Found`: Model or model version not found.
*   `500 Internal Server Error`: An error occurred during prediction (e.g., model inactive, loading failed, prediction logic error).

### 4.2. Serve Prediction by Version Tag

**Endpoint**: `/api/v1/predict/{model_id}/{version_tag}`
**Method**: `POST`
**Authentication**: Required (`predictor` or `admin` role)
**Description**: Requests a prediction from a specific model version using its tag. The version must be active.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_tag` (string, required): The tag of the model version to use for prediction (e.g., "v1.0.0", "stable").

**Request Body**:
```json
{
  "feature1": 10.5,
  "feature2": 2.0
}
```

**Response (200 OK)**:
```json
{
  "predicted_value": 150.75
}
```

---

## 5. Prediction Logs (`/api/v1/models/{model_id}/versions/{version_id}/logs`)

Retrieves historical prediction records.

### 5.1. Get Prediction Logs for a Model Version

**Endpoint**: `/api/v1/models/{model_id}/versions/{version_id}/logs`
**Method**: `GET`
**Authentication**: Required (`viewer` or `admin` role)
**Description**: Retrieves a list of recent prediction logs for a specific model version. Limited to the 100 most recent entries.

**Path Parameters**:
*   `model_id` (integer, required): The ID of the parent model.
*   `version_id` (integer, required): The ID of the model version.

**Response (200 OK)**:
```json
[
  {
    "id": 201,
    "model_version_id": 101,
    "input_data": {
      "feature1": 10.5,
      "feature2": 2.0
    },
    "output_data": {
      "predicted_value": 150.75
    },
    "timestamp": "2023-10-27T13:00:00Z",
    "status": "SUCCESS",
    "error_message": ""
  },
  {
    "id": 202,
    "model_version_id": 101,
    "input_data": {
      "feature1": 5.0
    },
    "output_data": {},
    "timestamp": "2023-10-27T13:05:00Z",
    "status": "ERROR",
    "error_message": "Missing required feature: feature2"
  }
]
```

---

## Error Handling

The API returns standardized JSON error responses.

**Example Error Response**:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Model with ID 999 not found."
}
```
Common status codes:
*   `400 Bad Request`: Client-side error, invalid input.
*   `401 Unauthorized`: Authentication failed (missing or invalid token).
*   `403 Forbidden`: Authorization failed (user role lacks permission).
*   `404 Not Found`: Resource not found.
*   `409 Conflict`: Resource already exists or state conflict (e.g., duplicate name).
*   `500 Internal Server Error`: Unexpected server-side error.
```
```