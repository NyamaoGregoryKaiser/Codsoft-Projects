# Web Scraping Automation Platform API Documentation

This document provides a comprehensive overview of the RESTful API endpoints for the Web Scraping Automation Platform.
For an interactive API explorer, please visit the Swagger UI at `http://localhost:8080/swagger-ui.html` when the application is running.

---

## Base URL

`http://localhost:8080/api`

---

## Authentication

All API endpoints (except `/api/auth/register` and `/api/auth/authenticate`) require authentication. A JWT (JSON Web Token) must be provided in the `Authorization` header as a `Bearer` token.

**Request Header Example:**
`Authorization: Bearer <your_jwt_token>`

### Register User

*   **Endpoint:** `POST /api/auth/register`
*   **Description:** Registers a new user with a default `USER` role.
*   **Request Body:**
    ```json
    {
      "username": "newuser",
      "password": "securepassword"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "username": "newuser",
      "message": "Registration successful"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., empty username/password).
    *   `409 Conflict`: User with this username already exists.

### Authenticate User

*   **Endpoint:** `POST /api/auth/authenticate`
*   **Description:** Authenticates an existing user and returns a JWT token.
*   **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "adminpass"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "username": "admin",
      "message": "Authentication successful"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Bad credentials.

---

## 1. Scraper Definitions

**Base Endpoint:** `/api/scrapers`

### 1.1 Get All Scraper Definitions

*   **Endpoint:** `GET /api/scrapers`
*   **Description:** Retrieves a paginated list of all defined web scrapers.
*   **Roles:** `USER`, `ADMIN`
*   **Query Parameters:**
    *   `page` (optional): Page number (0-indexed, default 0).
    *   `size` (optional): Number of items per page (default 20).
    *   `sort` (optional): Sorting criteria in the format `property,direction` (e.g., `name,asc`).
*   **Response (200 OK):**
    ```json
    {
      "content": [
        {
          "id": 1,
          "name": "Example Blog Scraper",
          "targetUrl": "https://blog.scrapinghub.com/",
          "itemCssSelector": "div.post-card",
          "fieldDefinitions": {
            "title": "h2.post-title",
            "url": "a.post-title-link[href]",
            "author": "span.author-name"
          },
          "scheduleIntervalMinutes": 10,
          "active": true,
          "createdByUsername": "admin",
          "createdAt": "2023-10-27T10:00:00",
          "updatedAt": "2023-10-27T10:00:00"
        }
      ],
      "pageable": { ... },
      "last": false,
      "totalPages": 1,
      "totalElements": 1,
      "size": 20,
      "number": 0,
      "first": true,
      "numberOfElements": 1,
      "empty": false
    }
    ```

### 1.2 Get Scraper Definition by ID

*   **Endpoint:** `GET /api/scrapers/{id}`
*   **Description:** Retrieves a single scraper definition by its unique ID.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraper definition.
*   **Response (200 OK):**
    ```json
    {
      "id": 1,
      "name": "Example Blog Scraper",
      "targetUrl": "https://blog.scrapinghub.com/",
      "itemCssSelector": "div.post-card",
      "fieldDefinitions": {
        "title": "h2.post-title",
        "url": "a.post-title-link[href]",
        "author": "span.author-name"
      },
      "scheduleIntervalMinutes": 10,
      "active": true,
      "createdByUsername": "admin",
      "createdAt": "2023-10-27T10:00:00",
      "updatedAt": "2023-10-27T10:00:00"
    }
    ```
*   **Error Responses:**
    *   `404 Not Found`: Scraper definition with the given ID does not exist.

### 1.3 Create New Scraper Definition

*   **Endpoint:** `POST /api/scrapers`
*   **Description:** Creates a new web scraper definition. The `createdBy` field is automatically set to the authenticated user.
*   **Roles:** `USER`, `ADMIN`
*   **Request Body (`ScraperCreateRequest`):**
    ```json
    {
      "name": "My New Product Scraper",
      "targetUrl": "https://example.com/products",
      "itemCssSelector": "div.product-item",
      "fieldDefinitions": {
        "productName": "h3.item-title",
        "price": "span.item-price",
        "detailUrl": "a.item-link[href]"
      },
      "scheduleIntervalMinutes": 60, // 0 for manual only, > 0 for scheduled
      "active": true
    }
    ```
*   **Response (201 Created):** Returns the created `ScraperDefinitionDTO`.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., missing required fields, invalid URL, malformed JSON for field definitions, schedule interval < 0).
    *   `409 Conflict`: A scraper with the provided name already exists.

### 1.4 Update Scraper Definition

*   **Endpoint:** `PUT /api/scrapers/{id}`
*   **Description:** Updates an existing web scraper definition identified by its ID. Only provided fields will be updated.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraper definition to update.
*   **Request Body (`ScraperUpdateRequest`):**
    ```json
    {
      "targetUrl": "https://example.com/updated-products",
      "scheduleIntervalMinutes": 120,
      "active": false
    }
    ```
*   **Response (200 OK):** Returns the updated `ScraperDefinitionDTO`.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., invalid URL, malformed JSON for field definitions, schedule interval < 0).
    *   `404 Not Found`: Scraper definition with the given ID does not exist.
    *   `409 Conflict`: If updating the `name` to one that already exists for another scraper.

### 1.5 Delete Scraper Definition

*   **Endpoint:** `DELETE /api/scrapers/{id}`
*   **Description:** Deletes a web scraper definition by its ID.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraper definition to delete.
*   **Response (204 No Content):**
*   **Error Responses:**
    *   `404 Not Found`: Scraper definition with the given ID does not exist.

### 1.6 Manually Trigger Scraping Task

*   **Endpoint:** `POST /api/scrapers/{id}/run`
*   **Description:** Initiates an on-demand scraping task for the specified scraper definition. The task runs asynchronously.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraper definition to run.
*   **Response (202 Accepted):** Returns the newly created `ScrapingTaskDTO` in `PENDING` status.
    ```json
    {
      "id": 101,
      "scraperDefinitionId": 1,
      "scraperDefinitionName": "Example Blog Scraper",
      "status": "PENDING",
      "startTime": "2023-10-27T10:05:00",
      "endTime": null,
      "errorMessage": null,
      "executedByUsername": "admin",
      "createdAt": "2023-10-27T10:05:00"
    }
    ```
*   **Error Responses:**
    *   `404 Not Found`: Scraper definition with the given ID does not exist.

---

## 2. Scraping Tasks

**Base Endpoint:** `/api/tasks`

### 2.1 Get All Scraping Tasks

*   **Endpoint:** `GET /api/tasks`
*   **Description:** Retrieves a paginated list of all scraping tasks.
*   **Roles:** `USER`, `ADMIN`
*   **Query Parameters:**
    *   `scraperDefinitionId` (long, optional): Filter tasks by a specific scraper definition.
    *   `page` (optional): Page number (0-indexed, default 0).
    *   `size` (optional): Number of items per page (default 20).
    *   `sort` (optional): Sorting criteria (e.g., `startTime,desc`).
*   **Response (200 OK):**
    ```json
    {
      "content": [
        {
          "id": 101,
          "scraperDefinitionId": 1,
          "scraperDefinitionName": "Example Blog Scraper",
          "status": "COMPLETED",
          "startTime": "2023-10-27T10:05:00",
          "endTime": "2023-10-27T10:05:15",
          "errorMessage": null,
          "executedByUsername": "admin",
          "createdAt": "2023-10-27T10:05:00"
        }
      ],
      "pageable": { ... },
      "last": true,
      "totalPages": 1,
      "totalElements": 1,
      "size": 20,
      "number": 0,
      "first": true,
      "numberOfElements": 1,
      "empty": false
    }
    ```

### 2.2 Get Scraping Task by ID

*   **Endpoint:** `GET /api/tasks/{id}`
*   **Description:** Retrieves a single scraping task by its unique ID.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraping task.
*   **Response (200 OK):** (Same structure as `content` item in 2.1)
*   **Error Responses:**
    *   `404 Not Found`: Scraping task with the given ID does not exist.

---

## 3. Scraped Data

**Base Endpoint:** `/api/data`

### 3.1 Get All Scraped Data Items

*   **Endpoint:** `GET /api/data`
*   **Description:** Retrieves a paginated list of all scraped data items.
*   **Roles:** `USER`, `ADMIN`
*   **Query Parameters:**
    *   `taskId` (long, optional): Filter data by a specific scraping task.
    *   `scraperDefinitionId` (long, optional): Filter data by a specific scraper definition.
    *   `page` (optional): Page number (0-indexed, default 0).
    *   `size` (optional): Number of items per page (default 20).
    *   `sort` (optional): Sorting criteria (e.g., `scrapedAt,desc`).
*   **Response (200 OK):**
    ```json
    {
      "content": [
        {
          "id": 201,
          "scrapingTaskId": 101,
          "scraperDefinitionId": 1,
          "scraperDefinitionName": "Example Blog Scraper",
          "data": {
            "title": "A blog post title",
            "url": "/blog/a-post",
            "author": "John Doe"
          },
          "scrapedAt": "2023-10-27T10:05:10"
        }
      ],
      "pageable": { ... },
      "last": true,
      "totalPages": 1,
      "totalElements": 1,
      "size": 20,
      "number": 0,
      "first": true,
      "numberOfElements": 1,
      "empty": false
    }
    ```

### 3.2 Get Scraped Data Item by ID

*   **Endpoint:** `GET /api/data/{id}`
*   **Description:** Retrieves a single scraped data item by its unique ID.
*   **Roles:** `USER`, `ADMIN`
*   **Path Parameters:**
    *   `id` (long, required): The ID of the scraped data item.
*   **Response (200 OK):** (Same structure as `content` item in 3.1)
*   **Error Responses:**
    *   `404 Not Found`: Scraped data item with the given ID does not exist.

---

## Error Handling

The API provides consistent error responses in JSON format:

```json
{
  "status": "BAD_REQUEST",
  "timestamp": "27-10-2023 10:30:45",
  "message": "Validation Error",
  "debugMessage": "Validation failed for argument...",
  "errors": [
    "Scraper name cannot be empty",
    "Invalid URL format"
  ]
}
```

Common HTTP status codes for errors:

*   `400 Bad Request`: Invalid input, validation errors.
*   `401 Unauthorized`: Missing or invalid authentication token.
*   `403 Forbidden`: Authenticated user does not have necessary permissions.
*   `404 Not Found`: Resource does not exist.
*   `409 Conflict`: Resource conflict (e.g., creating a duplicate name).
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Unexpected server-side errors.

---

## Rate Limiting

API endpoints are subject to rate limiting. By default, clients are limited to **5 requests per 10 seconds per IP address**.
If the limit is exceeded, a `429 Too Many Requests` status will be returned with a message.

---
```