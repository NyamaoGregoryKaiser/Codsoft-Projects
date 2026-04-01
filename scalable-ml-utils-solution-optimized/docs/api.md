```markdown
# API Documentation

This document provides an overview of the REST API endpoints available in the ML Utilities System. The API follows a RESTful design pattern, using JSON for request/response bodies and standard HTTP status codes.

For detailed interactive documentation, refer to the auto-generated Swagger UI (`/docs`) or ReDoc (`/redoc`) endpoints on the running backend.

## Base URL

`http://localhost:8000/api/v1` (when running locally via Docker Compose)

## Authentication

Authentication is performed using JWT (JSON Web Tokens).
1.  **`POST /auth/login`**: Authenticate a user with email and password.
    *   **Request:** `application/x-www-form-urlencoded` with `username` (email) and `password`.
    *   **Response (200 OK):** A `Token` object containing `access_token` and `token_type` (bearer).
    *   **Error (401 Unauthorized):** Invalid credentials.
2.  **`POST /auth/register`**: Register a new user.
    *   **Request:** `application/json` with `username`, `email`, `password`.
    *   **Response (201 Created):** `User` object of the newly created user.
    *   **Error (400 Bad Request):** User with email/username already exists.
3.  **`GET /auth/me`**: Get details of the current authenticated user.
    *   **Requires:** `Authorization: Bearer <access_token>` header.
    *   **Response (200 OK):** `User` object.
    *   **Error (401 Unauthorized):** Invalid or missing token.

All protected endpoints require the `Authorization: Bearer <access_token>` header.

## Error Handling

The API uses standard HTTP status codes and returns JSON error responses in the format:
```json
{
  "detail": "Error message description",
  "error_type": "SpecificErrorType"
}
```
*   `400 Bad Request`: Invalid request data, business logic violation.
*   `401 Unauthorized`: Authentication failed, invalid/missing token.
*   `403 Forbidden`: User does not have necessary permissions.
*   `404 Not Found`: Resource not found.
*   `422 Unprocessable Entity`: Validation error from Pydantic.
*   `500 Internal Server Error`: Unexpected server error.

## Endpoints

### Users (`/users`)

*   **`GET /users/`**
    *   **Description:** Retrieve a list of all users.
    *   **Permissions:** Superuser only.
    *   **Response:** `List[User]`
*   **`POST /users/`**
    *   **Description:** Create a new user.
    *   **Permissions:** Superuser only.
    *   **Request:** `UserCreate` schema.
    *   **Response:** `User`
*   **`GET /users/{user_id}`**
    *   **Description:** Get a specific user by ID.
    *   **Permissions:** Superuser only.
    *   **Response:** `User`
*   **`PUT /users/{user_id}`**
    *   **Description:** Update an existing user.
    *   **Permissions:** Superuser only.
    *   **Request:** `UserUpdate` schema.
    *   **Response:** `User`
*   **`DELETE /users/{user_id}`**
    *   **Description:** Delete a user.
    *   **Permissions:** Superuser only.
    *   **Response:** `User` (deleted user object)

### Datasets (`/datasets`)

*   **`POST /datasets/`**
    *   **Description:** Upload a new dataset (CSV file).
    *   **Permissions:** Authenticated user.
    *   **Request:** `multipart/form-data` with `file` (CSV file).
    *   **Response:** `Dataset`
*   **`GET /datasets/`**
    *   **Description:** Retrieve a list of datasets owned by the current user.
    *   **Permissions:** Authenticated user.
    *   **Response:** `List[Dataset]`
*   **`GET /datasets/{dataset_id}`**
    *   **Description:** Get details of a specific dataset.
    *   **Permissions:** Authenticated user (must own the dataset).
    *   **Response:** `Dataset`
*   **`GET /datasets/{dataset_id}/preview`**
    *   **Description:** Get a preview of the dataset's data.
    *   **Permissions:** Authenticated user (must own the dataset).
    *   **Query Parameters:** `rows` (int, default=5)
    *   **Response:** JSON object with `columns`, `data` (list of rows), `total_rows`.
*   **`PUT /datasets/{dataset_id}`**
    *   **Description:** Update a dataset's metadata (e.g., name, description).
    *   **Permissions:** Authenticated user (must own the dataset).
    *   **Request:** `DatasetUpdate` schema.
    *   **Response:** `Dataset`
*   **`DELETE /datasets/{dataset_id}`**
    *   **Description:** Delete a dataset and its associated file from storage.
    *   **Permissions:** Authenticated user (must own the dataset).
    *   **Response:** `Dataset` (deleted dataset object)

### Models (`/models`)

*   **`POST /models/train`**
    *   **Description:** Train a new ML model on an existing dataset. This is a synchronous operation for simplicity, but would be async in a large-scale system.
    *   **Permissions:** Authenticated user.
    *   **Request:** `ModelCreate` schema (includes `dataset_id`, `model_type`, `target_column`, `features`).
    *   **Response:** `Model` (newly created model object).
*   **`GET /models/`**
    *   **Description:** Retrieve a list of models owned by the current user.
    *   **Permissions:** Authenticated user.
    *   **Response:** `List[Model]`
*   **`GET /models/{model_id}`**
    *   **Description:** Get details of a specific model.
    *   **Permissions:** Authenticated user (must own the model).
    *   **Response:** `Model`
*   **`PUT /models/{model_id}`**
    *   **Description:** Update a model's metadata.
    *   **Permissions:** Authenticated user (must own the model).
    *   **Request:** `ModelUpdate` schema.
    *   **Response:** `Model`
*   **`DELETE /models/{model_id}`**
    *   **Description:** Delete a model, its artifact, and all associated experiments.
    *   **Permissions:** Authenticated user (must own the model).
    *   **Response:** `Model` (deleted model object).
*   **`POST /models/predict`**
    *   **Description:** Make predictions using a trained model.
    *   **Permissions:** Authenticated user (must own the model).
    *   **Request:** `ModelPredictRequest` schema (includes `model_id` and `data` as `List[dict]`).
    *   **Response:** `List[Any]` (the prediction results).

### Experiments (`/experiments`)

*   **`GET /experiments/`**
    *   **Description:** Retrieve a list of experiments associated with models owned by the current user.
    *   **Permissions:** Authenticated user.
    *   **Response:** `List[Experiment]`
*   **`GET /experiments/{experiment_id}`**
    *   **Description:** Get details of a specific experiment.
    *   **Permissions:** Authenticated user (must own the model associated with the experiment).
    *   **Response:** `Experiment`
*   **`DELETE /experiments/{experiment_id}`**
    *   **Description:** Delete an experiment.
    *   **Permissions:** Authenticated user (must own the model associated with the experiment).
    *   **Response:** `Experiment` (deleted experiment object).
```