```markdown
# VisuFlow API Documentation

The VisuFlow backend exposes a RESTful API for programmatic interaction with the platform. This document provides an overview of the API structure, authentication, and key endpoints.

For the most up-to-date and interactive API documentation, please refer to the live Swagger UI: `http://localhost:8000/docs`

---

## Base URL

The base URL for all API endpoints is: `http://localhost:8000/api/v1`

(In a production environment, this would be your deployed domain, e.g., `https://api.visuflow.com/api/v1`)

## Authentication

All protected API endpoints require a JSON Web Token (JWT) passed in the `Authorization` header as a `Bearer` token.

### 1. Obtain Access Token

**Endpoint:** `POST /api/v1/login/access-token`

**Description:** Authenticates a user and returns a JWT access token.

**Request Body (x-www-form-urlencoded):**

| Field    | Type     | Description              | Required |
| :------- | :------- | :----------------------- | :------- |
| `username` | `string` | User's email address     | Yes      |
| `password` | `string` | User's plain password    | Yes      |

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer"
}
```

**Error Responses:**

*   `400 Bad Request`: Incorrect email or password, Inactive user.
*   `429 Too Many Requests`: Rate limit exceeded.

### 2. Test Token Validity

**Endpoint:** `POST /api/v1/login/test-token`

**Description:** Verifies if the provided JWT is valid and returns the authenticated user's details.

**Request Headers:**

| Header        | Value                  |
| :------------ | :--------------------- |
| `Authorization` | `Bearer <access_token>` |

**Response (200 OK):**

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Test User",
  "is_active": true,
  "is_superuser": false
}
```

**Error Responses:**

*   `401 Unauthorized`: Invalid or missing token.

## Users

Manage user accounts. Accessible only by superusers for most operations.

### 1. Register New User

**Endpoint:** `POST /api/v1/register`

**Description:** Registers a new non-superuser account.

**Request Body (application/json):**

| Field        | Type     | Description          | Required |
| :----------- | :------- | :------------------- | :------- |
| `email`      | `string` | User's email         | Yes      |
| `password`   | `string` | User's password (min 8 chars) | Yes      |
| `full_name`  | `string` | Optional full name   | No       |

**Response (201 Created):**

```json
{
  "id": 2,
  "email": "newuser@example.com",
  "full_name": "New Test User",
  "is_active": true,
  "is_superuser": false
}
```

**Error Responses:**

*   `400 Bad Request`: User with this email already exists.
*   `403 Forbidden`: Attempted to register as a superuser.
*   `422 Unprocessable Entity`: Validation error (e.g., password too short).

### 2. Get Current User Details

**Endpoint:** `GET /api/v1/users/me`

**Description:** Retrieves details of the authenticated user.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** (Same as `test-token` response)

### 3. Update Current User Details

**Endpoint:** `PUT /api/v1/users/me`

**Description:** Updates details of the authenticated user.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):** (Fields are optional)

| Field        | Type     | Description          |
| :----------- | :------- | :------------------- |
| `email`      | `string` | New email            |
| `password`   | `string` | New password (min 8 chars) |
| `full_name`  | `string` | New full name        |

**Response (200 OK):** Updated user details.

## Data Sources

Manage connections to external data sources.

### 1. Create Data Source

**Endpoint:** `POST /api/v1/datasources`

**Description:** Creates a new data source connection. Only accessible by authenticated users.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):**

| Field               | Type                  | Description                                            | Required |
| :------------------ | :-------------------- | :----------------------------------------------------- | :------- |
| `name`              | `string`              | Unique name for the data source                        | Yes      |
| `type`              | `string` (enum)       | Type of data source (`PostgreSQL`, `API`, `S3`, etc.) | Yes      |
| `connection_string` | `string`              | Connection URI or base URL                             | Yes (for DBs, APIs) |
| `config`            | `object` (JSON)       | Additional configuration (e.g., headers for API)       | No       |
| `description`       | `string`              | Optional description                                   | No       |

**Response (201 Created):** New data source object.

### 2. Get All Data Sources

**Endpoint:** `GET /api/v1/datasources`

**Description:** Retrieves a list of all data sources owned by the current user. Superusers can see all.

**Request Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**

| Field   | Type      | Description                   |
| :------ | :-------- | :---------------------------- |
| `skip`  | `integer` | Number of items to skip (for pagination) |
| `limit` | `integer` | Max number of items to return |

**Response (200 OK):** `Array` of data source objects.

### 3. Get Data Source by ID

**Endpoint:** `GET /api/v1/datasources/{datasource_id}`

**Description:** Retrieves a specific data source by its ID.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** Data source object.

### 4. Update Data Source

**Endpoint:** `PUT /api/v1/datasources/{datasource_id}`

**Description:** Updates an existing data source.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):** (Fields are optional)

| Field               | Type                  | Description                                            |
| :------------------ | :-------------------- | :----------------------------------------------------- |
| `name`              | `string`              | New name                                               |
| `type`              | `string` (enum)       | New type                                               |
| `connection_string` | `string`              | New connection URI or base URL                         |
| `config`            | `object` (JSON)       | New additional configuration                           |
| `description`       | `string`              | New description                                        |

**Response (200 OK):** Updated data source object.

### 5. Delete Data Source

**Endpoint:** `DELETE /api/v1/datasources/{datasource_id}`

**Description:** Deletes a data source.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** Deleted data source object.

## Dashboards

Manage data visualization dashboards.

### 1. Create Dashboard

**Endpoint:** `POST /api/v1/dashboards`

**Description:** Creates a new dashboard.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):**

| Field         | Type            | Description                                  | Required |
| :------------ | :-------------- | :------------------------------------------- | :------- |
| `title`       | `string`        | Title of the dashboard                       | Yes      |
| `description` | `string`        | Optional description                         | No       |
| `layout_config` | `object` (JSON) | Grid layout configuration for charts       | No       |
| `is_public`   | `boolean`       | Whether the dashboard is publicly viewable   | No       |

**Response (201 Created):** New dashboard object.

### 2. Get All Dashboards

**Endpoint:** `GET /api/v1/dashboards`

**Description:** Retrieves a list of all dashboards owned by the current user (or all for superusers). Public dashboards are also viewable.

**Request Headers:** `Authorization: Bearer <access_token>` (optional for public dashboards)

**Query Parameters:** (pagination similar to datasources)

**Response (200 OK):** `Array` of dashboard objects.

### 3. Get Dashboard by ID

**Endpoint:** `GET /api/v1/dashboards/{dashboard_id}`

**Description:** Retrieves a specific dashboard by its ID.

**Request Headers:** `Authorization: Bearer <access_token>` (optional for public dashboards)

**Response (200 OK):** Dashboard object including associated charts.

### 4. Update Dashboard

**Endpoint:** `PUT /api/v1/dashboards/{dashboard_id}`

**Description:** Updates an existing dashboard.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):** (Fields are optional)

| Field         | Type            | Description                                  |
| :------------ | :-------------- | :------------------------------------------- |
| `title`       | `string`        | New title                                    |
| `description` | `string`        | New description                              |
| `layout_config` | `object` (JSON) | New layout configuration                     |
| `is_public`   | `boolean`       | Update public status                         |
| `chart_ids`   | `array` (int)   | List of chart IDs to associate with dashboard |

**Response (200 OK):** Updated dashboard object.

### 5. Delete Dashboard

**Endpoint:** `DELETE /api/v1/dashboards/{dashboard_id}`

**Description:** Deletes a dashboard.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** Deleted dashboard object.

## Charts

Manage individual data visualization charts.

### 1. Create Chart

**Endpoint:** `POST /api/v1/charts`

**Description:** Creates a new chart.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):**

| Field                 | Type                  | Description                                      | Required |
| :-------------------- | :-------------------- | :----------------------------------------------- | :------- |
| `title`               | `string`              | Chart title                                      | Yes      |
| `chart_type`          | `string` (enum)       | Type of chart (`bar`, `line`, `pie`, `table`)    | Yes      |
| `data_source_id`      | `integer`             | ID of the associated data source                 | Yes      |
| `query`               | `string`              | SQL query or API endpoint path                   | Yes      |
| `query_params`        | `object` (JSON)       | Parameters for the query                         | No       |
| `visualization_options` | `object` (JSON)       | ECharts/Plotly options for rendering             | No       |
| `description`         | `string`              | Optional description                             | No       |

**Response (201 Created):** New chart object.

### 2. Get All Charts

**Endpoint:** `GET /api/v1/charts`

**Description:** Retrieves a list of all charts owned by the current user (or all for superusers).

**Request Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:** (pagination similar to datasources)

**Response (200 OK):** `Array` of chart objects.

### 3. Get Chart by ID

**Endpoint:** `GET /api/v1/charts/{chart_id}`

**Description:** Retrieves a specific chart by its ID.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** Chart object.

### 4. Update Chart

**Endpoint:** `PUT /api/v1/charts/{chart_id}`

**Description:** Updates an existing chart.

**Request Headers:** `Authorization: Bearer <access_token>`

**Request Body (application/json):** (Fields are optional)

| Field                 | Type                  | Description                                      |
| :-------------------- | :-------------------- | :----------------------------------------------- |
| `title`               | `string`              | New title                                        |
| `chart_type`          | `string` (enum)       | New chart type                                   |
| `data_source_id`      | `integer`             | New data source ID                               |
| `query`               | `string`              | New query                                        |
| `query_params`        | `object` (JSON)       | New query parameters                             |
| `visualization_options` | `object` (JSON)       | New visualization options                        |
| `description`         | `string`              | New description                                  |

**Response (200 OK):** Updated chart object.

### 5. Delete Chart

**Endpoint:** `DELETE /api/v1/charts/{chart_id}`

**Description:** Deletes a chart.

**Request Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):** Deleted chart object.

### 6. Get Chart Data

**Endpoint:** `GET /api/v1/charts/{chart_id}/data`

**Description:** Fetches the actual data for a chart by executing its defined query against the associated data source. This endpoint leverages the caching layer.

**Request Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:** (Optional, depends on chart's query definition)

| Field      | Type     | Description                      |
| :--------- | :------- | :------------------------------- |
| `param1`   | `string` | Example query parameter          |
| `startDate`| `string` | Example date filter parameter    |

**Response (200 OK):** `Array` of JSON objects representing the data rows.

```json
[
  { "date": "2023-01-01", "sales": 1500, "region": "East" },
  { "date": "2023-01-02", "sales": 1200, "region": "West" },
  { "date": "2023-01-03", "sales": 1800, "region": "East" }
]
```

**Error Responses:**

*   `404 Not Found`: Chart or Data Source not found.
*   `500 Internal Server Error`: Error during data fetching from the external source.

---
```