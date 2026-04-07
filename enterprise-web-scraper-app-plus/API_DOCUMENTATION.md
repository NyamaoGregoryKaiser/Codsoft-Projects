# Web Scraping Tools System - API Documentation

This document describes the RESTful API endpoints for the Web Scraping Tools System. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api` (or your deployed backend URL)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header, formatted as `Bearer <token>`.

### 1. Register User
*   **Endpoint:** `POST /api/auth/register`
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "StrongPassword123",
      "role": "USER" // Optional, defaults to USER. Can be ADMIN.
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": "clxk0g8n00000r55m88r10p12",
        "email": "user@example.com",
        "role": "USER",
        "createdAt": "2023-10-27T10:00:00.000Z"
      }
    }
    ```
*   **Error (400 Bad Request):** If email already exists or validation fails.

### 2. Login User
*   **Endpoint:** `POST /api/auth/login`
*   **Description:** Authenticates a user and returns a JWT.
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "StrongPassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "clxk0g8n00000r55m88r10p12",
        "email": "user@example.com",
        "role": "USER"
      }
    }
    ```
*   **Error (401 Unauthorized):** Invalid credentials.

### 3. Get Current User
*   **Endpoint:** `GET /api/auth/me`
*   **Description:** Retrieves the details of the authenticated user.
*   **Authentication:** Required
*   **Response (200 OK):**
    ```json
    {
      "id": "clxk0g8n00000r55m88r10p12",
      "email": "user@example.com",
      "role": "USER",
      "createdAt": "2023-10-27T10:00:00.000Z"
    }
    ```
*   **Error (401 Unauthorized):** Invalid/missing token.

## Scraping Jobs

### 1. Create Scraping Job
*   **Endpoint:** `POST /api/jobs`
*   **Description:** Creates a new scraping job.
*   **Authentication:** Required
*   **Request Body:**
    ```json
    {
      "name": "My First Scraper",
      "url": "https://example.com/products",
      "cssSelectors": [
        { "name": "productTitle", "selector": ".product-title" },
        { "name": "productPrice", "selector": ".product-price" }
      ],
      "cronSchedule": "0 * * * *", // Every hour (optional)
      "isActive": true
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "clxk0g8n00000r55m88r10p13",
      "userId": "clxk0g8n00000r55m88r10p12",
      "name": "My First Scraper",
      "url": "https://example.com/products",
      "cssSelectors": [ { "name": "productTitle", "selector": ".product-title" } ],
      "cronSchedule": "0 * * * *",
      "isActive": true,
      "lastRunAt": null,
      "createdAt": "2023-10-27T10:05:00.000Z",
      "updatedAt": "2023-10-27T10:05:00.000Z"
    }
    ```
*   **Error (400 Bad Request):** Validation failed.
*   **Error (403 Forbidden):** User not authorized (e.g., if role isn't allowed to create).

### 2. Get All Scraping Jobs
*   **Endpoint:** `GET /api/jobs`
*   **Description:** Retrieves a list of all scraping jobs for the authenticated user.
*   **Authentication:** Required
*   **Query Parameters (Optional):**
    *   `limit`: Number of jobs to return (default: 10)
    *   `offset`: Number of jobs to skip (default: 0)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "clxk0g8n00000r55m88r10p13",
        "userId": "clxk0g8n00000r55m88r10p12",
        "name": "My First Scraper",
        "url": "https://example.com/products",
        "cssSelectors": [ ... ],
        "cronSchedule": "0 * * * *",
        "isActive": true,
        "lastRunAt": "2023-10-27T10:30:00.000Z",
        "createdAt": "2023-10-27T10:05:00.000Z",
        "updatedAt": "2023-10-27T10:30:00.000Z"
      },
      // ... more jobs
    ]
    ```

### 3. Get Single Scraping Job
*   **Endpoint:** `GET /api/jobs/:id`
*   **Description:** Retrieves details of a specific scraping job.
*   **Authentication:** Required
*   **Parameters:** `id` (Job ID)
*   **Response (200 OK):**
    ```json
    {
      "id": "clxk0g8n00000r55m88r10p13",
      "userId": "clxk0g8n00000r55m88r10p12",
      "name": "My First Scraper",
      "url": "https://example.com/products",
      "cssSelectors": [ { "name": "productTitle", "selector": ".product-title" } ],
      "cronSchedule": "0 * * * *",
      "isActive": true,
      "lastRunAt": "2023-10-27T10:30:00.000Z",
      "createdAt": "2023-10-27T10:05:00.000Z",
      "updatedAt": "2023-10-27T10:30:00.000Z"
    }
    ```
*   **Error (404 Not Found):** Job with `id` not found or not owned by user.

### 4. Update Scraping Job
*   **Endpoint:** `PUT /api/jobs/:id`
*   **Description:** Updates an existing scraping job.
*   **Authentication:** Required
*   **Parameters:** `id` (Job ID)
*   **Request Body:** (Partial updates are supported, send only fields to change)
    ```json
    {
      "name": "Updated Scraper Name",
      "cronSchedule": "0 0 * * *", // Every day at midnight
      "isActive": false
    }
    ```
*   **Response (200 OK):** (Returns the updated job object)
    ```json
    {
      "id": "clxk0g8n00000r55m88r10p13",
      "userId": "clxk0g8n00000r55m88r10p12",
      "name": "Updated Scraper Name",
      "url": "https://example.com/products",
      "cssSelectors": [ ... ],
      "cronSchedule": "0 0 * * *",
      "isActive": false,
      "lastRunAt": "2023-10-27T10:30:00.000Z",
      "createdAt": "2023-10-27T10:05:00.000Z",
      "updatedAt": "2023-10-27T11:00:00.000Z"
    }
    ```
*   **Error (400 Bad Request):** Validation failed.
*   **Error (404 Not Found):** Job with `id` not found or not owned by user.

### 5. Delete Scraping Job
*   **Endpoint:** `DELETE /api/jobs/:id`
*   **Description:** Deletes a scraping job and all its associated results.
*   **Authentication:** Required
*   **Parameters:** `id` (Job ID)
*   **Response (204 No Content):** On successful deletion.
*   **Error (404 Not Found):** Job with `id` not found or not owned by user.

### 6. Manually Run Scraping Job
*   **Endpoint:** `POST /api/jobs/:id/run`
*   **Description:** Manually triggers a scraping job to run immediately.
*   **Authentication:** Required
*   **Parameters:** `id` (Job ID)
*   **Response (202 Accepted):**
    ```json
    {
      "message": "Scraping job 'My First Scraper' triggered successfully."
    }
    ```
*   **Error (404 Not Found):** Job with `id` not found or not owned by user.
*   **Error (409 Conflict):** Job is already running (not explicitly handled in this example, but good practice for real systems).

## Scraping Results

### 1. Get Results for a Scraping Job
*   **Endpoint:** `GET /api/jobs/:id/results`
*   **Description:** Retrieves all scraping results for a specific job.
*   **Authentication:** Required
*   **Parameters:** `id` (Job ID)
*   **Query Parameters (Optional):**
    *   `limit`: Number of results to return (default: 10)
    *   `offset`: Number of results to skip (default: 0)
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "clxk0g8n00000r55m88r10p14",
        "jobId": "clxk0g8n00000r55m88r10p13",
        "status": "SUCCESS",
        "error": null,
        "data": [
          { "productTitle": "Product A", "productPrice": "$10.00" },
          { "productTitle": "Product B", "productPrice": "$15.50" }
        ],
        "timestamp": "2023-10-27T10:30:00.000Z"
      },
      {
        "id": "clxk0g8n00000r55m88r10p15",
        "jobId": "clxk0g8n00000r55m88r10p13",
        "status": "FAILED",
        "error": "Navigation timeout of 30000 ms exceeded.",
        "data": null,
        "timestamp": "2023-10-27T11:30:00.000Z"
      }
      // ... more results
    ]
    ```
*   **Error (404 Not Found):** Job with `id` not found or not owned by user.

### 2. Get Single Scraping Result
*   **Endpoint:** `GET /api/results/:id`
*   **Description:** Retrieves a single scraping result by its ID.
*   **Authentication:** Required
*   **Parameters:** `id` (Result ID)
*   **Response (200 OK):**
    ```json
    {
      "id": "clxk0g8n00000r55m88r10p14",
      "jobId": "clxk0g8n00000r55m88r10p13",
      "status": "SUCCESS",
      "error": null,
      "data": [
        { "productTitle": "Product A", "productPrice": "$10.00" },
        { "productTitle": "Product B", "productPrice": "$15.50" }
      ],
      "timestamp": "2023-10-27T10:30:00.000Z"
    }
    ```
*   **Error (404 Not Found):** Result with `id` not found or not owned by user's job.