```markdown
# API Documentation: ML Utilities System

This document describes the RESTful API endpoints for the ML Utilities System. The API follows standard HTTP methods and status codes, and uses JSON for request and response bodies.

**Base URL:** `/api/v1`

## Authentication

All protected endpoints require a JSON Web Token (JWT) sent in the `Authorization` header as `Bearer <token>`.

### Register User
`POST /auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "strongpassword123",
  "role": "user" // Optional, defaults to 'user'. Only 'admin' can set 'admin' role.
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "data": {
    "user": {
      "id": "uuid-of-user",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user"
    }
  }
}
```

### Login User
`POST /auth/login`

Authenticates a user and returns a JWT.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "strongpassword123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "data": {
    "user": {
      "id": "uuid-of-user",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user"
    }
  }
}
```

## Users (Admin-only access for most operations)

**Protected:** Yes, `admin` role required for `POST`, `PATCH`, `DELETE` and `GET /users`. Individual users can `GET` their own profile.

### Get All Users
`GET /users`

**Response (200 OK):**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "users": [
      {
        "id": "uuid-admin-user",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z"
      },
      {
        "id": "uuid-regular-user",
        "name": "Regular User",
        "email": "user@example.com",
        "role": "user",
        "createdAt": "2023-10-27T10:05:00.000Z",
        "updatedAt": "2023-10-27T10:05:00.000Z"
      }
    ]
  }
}
```

### Get User by ID
`GET /users/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-of-user",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
  }
}
```

### Create User
`POST /users`

**Request Body:** (Same as register, but admin can explicitly set role)
```json
{
  "name": "New Admin",
  "email": "new.admin@example.com",
  "password": "newadminpassword",
  "role": "admin"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "user": { /* ... user details ... */ }
  }
}
```

### Update User
`PATCH /users/:id`

**Request Body:** (Partial update, password can be updated)
```json
{
  "name": "John Smith",
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": { /* ... updated user details ... */ }
  }
}
```

### Delete User
`DELETE /users/:id`

**Response (204 No Content):**

## Projects

**Protected:** Yes, all operations require authentication. Users can only manage their own projects unless they are an admin.

### Get All Projects
`GET /projects`

Retrieves all projects for the authenticated user. Admins can view all projects across all users.

**Response (200 OK):**
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "projects": [
      {
        "id": "uuid-project-1",
        "name": "Sales Forecasting",
        "description": "Predicting future sales based on historical data.",
        "owner": { "id": "uuid-owner", "name": "Admin User" },
        "createdAt": "2023-10-27T11:00:00.000Z",
        "updatedAt": "2023-10-27T11:00:00.000Z"
      }
    ]
  }
}
```

### Get Project by ID
`GET /projects/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "project": {
      "id": "uuid-project-1",
      "name": "Sales Forecasting",
      "description": "Predicting future sales based on historical data.",
      "owner": { "id": "uuid-owner", "name": "Admin User" },
      "createdAt": "2023-10-27T11:00:00.000Z",
      "updatedAt": "2023-10-27T11:00:00.000Z"
    }
  }
}
```

### Create Project
`POST /projects`

**Request Body:**
```json
{
  "name": "New ML Project",
  "description": "A project to develop a new recommendation engine."
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "project": { /* ... new project details ... */ }
  }
}
```

### Update Project
`PATCH /projects/:id`

**Request Body:** (Partial update)
```json
{
  "description": "Updated description for the recommendation engine project."
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "project": { /* ... updated project details ... */ }
  }
}
```

### Delete Project
`DELETE /projects/:id`

**Response (204 No Content):**

## Datasets

**Protected:** Yes, all operations require authentication. Users can only manage their own datasets within their projects.

### Get All Datasets
`GET /datasets`
`GET /datasets?projectId=uuid-project-id` (Filter by project)

Retrieves all datasets for the authenticated user, optionally filtered by `projectId`.

**Response (200 OK):**
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "datasets": [
      {
        "id": "uuid-dataset-1",
        "name": "Customer Transactions",
        "description": "CSV of customer transaction history.",
        "filePath": "uploads/Customer-Transactions-1701100000000.csv",
        "fileSize": 123456,
        "mimeType": "text/csv",
        "projectId": "uuid-project-1",
        "ownerId": "uuid-owner",
        "createdAt": "2023-10-27T12:00:00.000Z",
        "updatedAt": "2023-10-27T12:00:00.000Z",
        "project": { /* ... project details ... */ },
        "owner": { /* ... owner details ... */ }
      }
    ]
  }
}
```

### Get Dataset by ID
`GET /datasets/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "dataset": { /* ... dataset details ... */ }
  }
}
```

### Upload Dataset
`POST /datasets`

**Request Body:** `multipart/form-data`
*   `name`: string (required)
*   `description`: string (optional)
*   `projectId`: string (uuid, required)
*   `file`: actual file upload (required)

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "dataset": { /* ... new dataset details ... */ }
  }
}
```

### Download Dataset
`GET /datasets/:id/download`

Initiates a file download for the specified dataset.

**Response (200 OK, file stream):**

### Delete Dataset
`DELETE /datasets/:id`

**Response (204 No Content):**

## Models

**Protected:** Yes, all operations require authentication. Users can only manage their own models within their projects.

### Get All Models
`GET /models`
`GET /models?projectId=uuid-project-id` (Filter by project)

Retrieves all models for the authenticated user, optionally filtered by `projectId`.

**Response (200 OK):**
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "models": [
      {
        "id": "uuid-model-1",
        "name": "Linear Regression Model",
        "description": "Model for predicting sales.",
        "version": "1.0.0",
        "filePath": "uploads/Linear-Regression-Model-1701100000000.pkl",
        "fileSize": 56789,
        "mimeType": "application/octet-stream",
        "projectId": "uuid-project-1",
        "ownerId": "uuid-owner",
        "createdAt": "2023-10-27T13:00:00.000Z",
        "updatedAt": "2023-10-27T13:00:00.000Z",
        "project": { /* ... project details ... */ },
        "owner": { /* ... owner details ... */ }
      }
    ]
  }
}
```

### Get Model by ID
`GET /models/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "model": { /* ... model details ... */ }
  }
}
```

### Upload Model
`POST /models`

**Request Body:** `multipart/form-data`
*   `name`: string (required)
*   `description`: string (optional)
*   `version`: string (e.g., "1.0.0", required)
*   `projectId`: string (uuid, required)
*   `file`: actual file upload (required)

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "model": { /* ... new model details ... */ }
  }
}
```

### Download Model
`GET /models/:id/download`

Initiates a file download for the specified model.

**Response (200 OK, file stream):**

### Run Inference
`POST /models/:id/inference`

*(Note: This is a **simulated** inference endpoint. In a production environment, this would integrate with a real ML serving system.)*

**Request Body:**
```json
{
  "inputData": {
    "feature1": 10.5,
    "feature2": "categoryA",
    "feature3": 25
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Inference simulated successfully.",
  "data": {
    "modelId": "uuid-model-1",
    "inputData": {
      "feature1": 10.5,
      "feature2": "categoryA",
      "feature3": 25
    },
    "prediction": 0.789123,
    "confidence": "high",
    "timestamp": "2023-10-27T14:30:00.000Z"
  }
}
```

### Delete Model
`DELETE /models/:id`

**Response (204 No Content):**

## Experiments

**Protected:** Yes, all operations require authentication. Users can only manage their own experiments within their projects.

*(CRUD operations for Experiments are stubbed out in the backend controller but would follow the same pattern as Projects, Datasets, and Models. Metrics and parameters are stored as JSONB.)*

### Get All Experiments
`GET /experiments`
`GET /experiments?projectId=uuid-project-id` (Filter by project)

**Response (200 OK):**
```json
{
  "status": "success",
  "results": 1,
  "data": {
    "experiments": [
      {
        "id": "uuid-experiment-1",
        "name": "Model Training Run 1",
        "description": "Initial training with default parameters.",
        "status": "completed",
        "parameters": {
          "learning_rate": 0.01,
          "epochs": 100,
          "optimizer": "adam"
        },
        "metrics": {
          "accuracy": 0.92,
          "loss": 0.08,
          "f1_score": 0.91
        },
        "projectId": "uuid-project-1",
        "modelId": "uuid-model-1",
        "datasetId": "uuid-dataset-1",
        "ownerId": "uuid-owner",
        "startTime": "2023-10-27T14:00:00.000Z",
        "endTime": "2023-10-27T14:15:00.000Z",
        "createdAt": "2023-10-27T14:00:00.000Z",
        "updatedAt": "2023-10-27T14:15:00.000Z",
        "project": { /* ... project details ... */ },
        "model": { /* ... model details ... */ },
        "dataset": { /* ... dataset details ... */ },
        "owner": { /* ... owner details ... */ }
      }
    ]
  }
}
```

### Get Experiment by ID
`GET /experiments/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "experiment": { /* ... experiment details ... */ }
  }
}
```

### Create Experiment
`POST /experiments`

**Request Body:**
```json
{
  "name": "New Experiment Run",
  "description": "Testing a new learning rate.",
  "projectId": "uuid-project-1",
  "modelId": "uuid-model-1",       // Optional
  "datasetId": "uuid-dataset-1",    // Optional
  "parameters": {
    "learning_rate": 0.005,
    "epochs": 150
  },
  "status": "pending"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "experiment": { /* ... new experiment details ... */ }
  }
}
```

### Update Experiment
`PATCH /experiments/:id`

**Request Body:** (Partial update)
```json
{
  "status": "completed",
  "endTime": "2023-10-27T15:00:00.000Z",
  "metrics": {
    "accuracy": 0.93,
    "loss": 0.07
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "experiment": { /* ... updated experiment details ... */ }
  }
}
```

### Delete Experiment
`DELETE /experiments/:id`

**Response (204 No Content):**

---

This API documentation can be further enhanced using tools like Swagger/OpenAPI. A `swagger.json` file is provided in `docs/swagger.json` as a starting point.
```