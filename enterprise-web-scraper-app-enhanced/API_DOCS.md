```markdown
# API Documentation: Web Scraping Tools System

This document describes the RESTful API endpoints provided by the C++ backend.

**Base URL:** `http://localhost:9080/api/v1`

**Authentication:** Most endpoints require a JSON Web Token (JWT) in the `Authorization` header: `Authorization: Bearer <YOUR_JWT_TOKEN>`.

---

## 1. Authentication Endpoints

### `POST /auth/register`

Registers a new user and returns a JWT token.

*   **Description:** Creates a new user account with a unique username and email.
*   **Request Body:** `application/json`
    ```json
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "yourstrongpassword"
    }
    ```
*   **Success Response:** `201 Created`, `application/json`
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "message": "User registered successfully."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input (e.g., empty fields, password too short, username/email already taken).
        ```json
        {
            "status": "error",
            "message": "Username already taken."
        }
        ```
    *   `500 Internal Server Error`: Server-side issue.

### `POST /auth/login`

Authenticates a user and returns a JWT token.

*   **Description:** Verifies user credentials and issues a JWT token valid for subsequent authenticated requests.
*   **Request Body:** `application/json`
    ```json
    {
        "username": "existinguser",
        "password": "yourpassword"
    }
    ```
*   **Success Response:** `200 OK`, `application/json`
    ```json
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "message": "Login successful."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing username or password.
    *   `401 Unauthorized`: Invalid username or password.
        ```json
        {
            "status": "error",
            "message": "Invalid credentials."
        }
        ```
    *   `500 Internal Server Error`: Server-side issue.

---

## 2. Scraping Job Endpoints

All endpoints under `/api/v1/jobs` require authentication.

### `GET /jobs`

Retrieves all scraping jobs for the authenticated user.

*   **Description:** Returns a list of all scraping jobs owned by the user associated with the provided JWT token.
*   **Authentication:** Required (Bearer Token)
*   **Success Response:** `200 OK`, `application/json`
    ```json
    [
        {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "user_id": "b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f",
            "name": "Example Product Scraper",
            "target_url": "https://example.com/products/item-1",
            "cron_schedule": "every 30 minutes",
            "css_selector": "h1.product-title, span.price",
            "status": "PENDING",
            "last_run_message": null,
            "last_run_at": null,
            "created_at": "2023-10-27 10:00:00",
            "updated_at": "2023-10-27 10:00:00"
        }
        // ... more job objects
    ]
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `500 Internal Server Error`: Server-side issue.

### `POST /jobs`

Creates a new scraping job.

*   **Description:** Adds a new scraping job configuration to the system for the authenticated user.
*   **Authentication:** Required (Bearer Token)
*   **Request Body:** `application/json`
    ```json
    {
        "name": "My New Product Watcher",
        "target_url": "https://anothersite.com/item/xyz",
        "cron_schedule": "0 10 * * *",  // Daily at 10 AM UTC, "manual" for manual trigger only
        "css_selector": "h1.item-name::text, div.current-stock::text"
    }
    ```
*   **Success Response:** `201 Created`, `application/json` (Returns the created job object)
    ```json
    {
        "id": "uuid-of-new-job",
        "user_id": "b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f",
        "name": "My New Product Watcher",
        "target_url": "https://anothersite.com/item/xyz",
        "cron_schedule": "0 10 * * *",
        "css_selector": "h1.item-name::text, div.current-stock::text",
        "status": "PENDING",
        "created_at": "2023-10-27 11:00:00",
        "updated_at": "2023-10-27 11:00:00"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid or missing job fields.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `500 Internal Server Error`: Server-side issue.

### `GET /jobs/:id`

Retrieves a specific scraping job by ID.

*   **Description:** Returns the details of a single scraping job, if it belongs to the authenticated user.
*   **Authentication:** Required (Bearer Token)
*   **URL Parameters:**
    *   `id` (string): The UUID of the scraping job.
*   **Success Response:** `200 OK`, `application/json` (Returns the job object)
    ```json
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "user_id": "b0e2f1d4-8c7a-4a5b-9d6e-0c1b2a3d4e5f",
        "name": "Example Product Scraper",
        "target_url": "https://example.com/products/item-1",
        "cron_schedule": "every 30 minutes",
        "css_selector": "h1.product-title, span.price",
        "status": "PENDING",
        "last_run_message": null,
        "last_run_at": null,
        "created_at": "2023-10-27 10:00:00",
        "updated_at": "2023-10-27 10:00:00"
    }
    ```
*   **Error Responses:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: Job not found or does not belong to the user.
    *   `500 Internal Server Error`: Server-side issue.

### `PUT /jobs/:id`

Updates an existing scraping job.

*   **Description:** Modifies the details of an existing scraping job. Only fields provided in the request body will be updated.
*   **Authentication:** Required (Bearer Token)
*   **URL Parameters:**
    *   `id` (string): The UUID of the scraping job.
*   **Request Body:** `application/json` (Partial updates allowed)
    ```json
    {
        "name": "Updated Product Watcher",
        "cron_schedule": "0 0 * * *", // Update to daily
        "status": "CANCELLED"         // Change job status
    }
    ```
*   **Success Response:** `200 OK`, `application/