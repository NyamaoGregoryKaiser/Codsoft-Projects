```markdown
# Database Optimizer API Documentation

This document outlines the API endpoints available for the Database Performance Monitoring and Optimization Dashboard.

## Base URL

`http://localhost:5000/api` (or your deployed backend URL)

## Authentication

All protected endpoints require a JSON Web Token (JWT) sent in the `Authorization` header as a Bearer token: `Authorization: Bearer <your_token>`.

### Auth Endpoints

#### `POST /api/auth/register`
- **Description**: Registers a new user.
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "role": "user" // Optional, defaults to 'user'. Only admin can set 'admin' role.
  }
  ```
- **Responses**:
  - `201 Created`: `{ "id": 1, "username": "newuser", "email": "newuser@example.com", "role": "user" }`
  - `400 Bad Request`: `{ "message": "User with this email already exists." }` or validation errors.

#### `POST /api/auth/login`
- **Description**: Authenticates a user and returns a JWT.
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Responses**:
  - `200 OK`: `{ "token": "eyJ...", "user": { "id": 1, "username": "user", "email": "user@example.com", "role": "user" } }`
  - `401 Unauthorized`: `{ "message": "Invalid credentials." }`

### User Endpoints (Requires Authentication)

#### `GET /api/users/me`
- **Description**: Get current authenticated user's profile.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: `{ "id": 1, "username": "user", "email": "user@example.com", "role": "user" }`
  - `401 Unauthorized`: `{ "message": "Unauthorized" }`

### Database Endpoints (Requires Authentication)

#### `POST /api/databases`
- **Description**: Registers a new database connection for monitoring.
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "My Prod DB",
    "dbName": "production_data",
    "dialect": "postgres",
    "host": "mydb.example.com",
    "port": 5432,
    "username": "dbuser",
    "password": "dbpassword",
    "ssl": true
  }
  ```
- **Responses**:
  - `201 Created`: Returns the created database object (without sensitive password).
  - `400 Bad Request`: Validation errors.

#### `GET /api/databases`
- **Description**: Retrieves all databases registered by the authenticated user.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: `[ { "id": 1, "name": "My Prod DB", ... }, ... ]`

#### `GET /api/databases/:id`
- **Description**: Retrieves details of a specific registered database.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: `{ "id": 1, "name": "My Prod DB", ... }`
  - `404 Not Found`: If database ID does not exist or user is not authorized.

#### `POST /api/databases/:id/test-connection`
- **Description**: Tests the connection to the specified registered database.
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: `{ "message": "Connection successful!" }`
  - `500 Internal Server Error`: `{ "message": "Could not connect to target database: ..." }`

#### `POST /api/databases/:id/analyze-queries`
- **Description**: Triggers a manual scan and analysis of slow queries for the specified database.
  (In a production system, this might also be handled by a scheduled background job).
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Responses**:
  - `200 OK`: `{ "message": "Query analysis triggered successfully.", "slowQueriesCount": 3 }`

### Query Endpoints (Requires Authentication)

#### `GET /api/queries/slow-queries?databaseId=<db_id>`
- **Description**: Retrieves all slow queries identified for a specific registered database.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `databaseId`: (Required) The ID of the database to fetch slow queries for.
- **Responses**:
  - `200 OK`: `[ { "id": 1, "queryText": "SELECT * FROM users...", "avgDurationMs": 500, ... }, ... ]`

#### `GET /api/queries/:slowQueryId/explain-plan`
- **Description**: Retrieves the EXPLAIN ANALYZE plan for a specific slow query.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Path Parameters**:
  - `slowQueryId`: The ID of the slow query record from `/api/queries/slow-queries`.
- **Responses**:
  - `200 OK`: `{ "planJson": [...], "planText": "..." }`
  - `404 Not Found`: If slow query or its plan doesn't exist.

### Optimization Endpoints (Requires Authentication)

#### `GET /api/optimizations?slowQueryId=<sq_id>`
- **Description**: Retrieves optimization suggestions for a given slow query.
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `slowQueryId`: (Required) The ID of the slow query to get suggestions for.
- **Responses**:
  - `200 OK`: `[ { "id": 1, "suggestionText": "Consider adding index...", "status": "pending", ... }, ... ]`

#### `PUT /api/optimizations/:id/status`
- **Description**: Updates the status of an optimization suggestion.
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Path Parameters**:
  - `id`: The ID of the optimization suggestion.
- **Body**:
  ```json
  {
    "status": "implemented", // or "rejected", "ignored"
    "implementationDate": "2024-05-15T10:00:00Z" // Optional, for "implemented" status
  }
  ```
- **Responses**:
  - `200 OK`: Returns the updated optimization object.
  - `400 Bad Request`: Invalid status or missing data.
  - `404 Not Found`: If optimization ID does not exist.

## Error Handling

The API returns JSON error responses with a `message` and `statusCode`.

```json
{
  "statusCode": 404,
  "message": "Not Found - /api/nonexistent-route"
}
```
```json
{
  "statusCode": 500,
  "message": "Internal Server Error: Something went wrong."
}
```
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```
```
```