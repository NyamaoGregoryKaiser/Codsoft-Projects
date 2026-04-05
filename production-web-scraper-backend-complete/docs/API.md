# API Documentation - Web Scraping Tools System

This document outlines the RESTful API endpoints for the Web Scraping Tools System.

**Base URL:** `/api` (e.g., `http://localhost:5000/api`)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header with the `Bearer` scheme.
Example: `Authorization: Bearer <your_access_token>`

### 1. Auth Endpoints

*   **`POST /api/auth/register`**
    *   **Description:** Register a new user.
    *   **Permissions:** Public
    *   **Request Body:**
        ```json
        {
          "name": "John Doe",
          "email": "john.doe@example.com",
          "password": "strongpassword123",
          "role": "user" // or "admin" (admin role might be restricted to initial seed or admin-only creation)
        }
        ```
    *   **Response:**
        ```json
        {
          "user": {
            "id": "uuid",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "user",
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
          },
          "tokens": {
            "access": {
              "token": "jwt_token",
              "expires": "timestamp"
            }
          }
        }
        ```
    *   **Error Codes:** `400 Bad Request` (e.g., email already taken, invalid password length)

*   **`POST /api/auth/login`**
    *   **Description:** Authenticate a user and receive access tokens.
    *   **Permissions:** Public
    *   **Request Body:**
        ```json
        {
          "email": "john.doe@example.com",
          "password": "strongpassword123"
        }
        ```
    *   **Response:**
        ```json
        {
          "user": {
            "id": "uuid",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "user",
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
          },
          "tokens": {
            "access": {
              "token": "jwt_token",
              "expires": "timestamp"
            }
          }
        }
        ```
    *   **Error Codes:** `401 Unauthorized` (incorrect email or password)

### 2. User Endpoints

*(Requires `admin` role for all operations)*

*   **`POST /api/users`**
    *   **Description:** Create a new user.
    *   **Permissions:** `manageUsers` (admin)
    *   **Request Body:** Same as `POST /api/auth/register`
    *   **Response:** Same as `POST /api/auth/register` (without tokens)
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`

*   **`GET /api/users`**
    *   **Description:** Get all users.
    *   **Permissions:** `getUsers` (admin)
    *   **Query Parameters:** `page`, `limit`, `sortBy`, `email`, `role`
    *   **Response:**
        ```json
        {
          "count": 10,
          "rows": [
            { "id": "uuid", "name": "...", "email": "...", "role": "...", "createdAt": "...", "updatedAt": "..." }
            // ...
          ]
        }
        ```
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`

*   **`GET /api/users/:userId`**
    *   **Description:** Get a user by ID.
    *   **Permissions:** `getUsers` (admin)
    *   **Response:** Single user object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

*   **`PATCH /api/users/:userId`**
    *   **Description:** Update a user by ID.
    *   **Permissions:** `manageUsers` (admin)
    *   **Request Body:** Partial user object (e.g., `{"name": "New Name"}`)
    *   **Response:** Updated user object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `400 Bad Request`

*   **`DELETE /api/users/:userId`**
    *   **Description:** Delete a user by ID.
    *   **Permissions:** `manageUsers` (admin)
    *   **Response:** `204 No Content`
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 3. Target Endpoints

*   **`POST /api/targets`**
    *   **Description:** Create a new scraping target.
    *   **Permissions:** `manageTargets` (admin, user)
    *   **Request Body:**
        ```json
        {
          "name": "Product Page Scraper",
          "url": "https://example.com/products/item123",
          "selectors": {
            "productName": "h1.product-title",
            "price": "span.price-value",
            "description": "#product-description",
            "imageUrl": "img.product-main-image::attr(src)"
          },
          "schedule": "0 0 * * *" // Optional cron string (e.g., daily at midnight), null for manual
        }
        ```
    *   **Response:** Created target object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`

*   **`GET /api/targets`**
    *   **Description:** Get all scraping targets. Users see only their own targets; admins see all. This endpoint is cached.
    *   **Permissions:** `getTargets` (admin, user)
    *   **Query Parameters:** `page`, `limit`, `sortBy`, `name`, `url`
    *   **Response:** Paginated list of target objects
    *   **Error Codes:** `401 Unauthorized`

*   **`GET /api/targets/:targetId`**
    *   **Description:** Get a single target by ID.
    *   **Permissions:** `getTargets` (admin, user - if target belongs to user)
    *   **Response:** Target object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

*   **`PATCH /api/targets/:targetId`**
    *   **Description:** Update a target by ID.
    *   **Permissions:** `manageTargets` (admin, user - if target belongs to user)
    *   **Request Body:** Partial target object. If `schedule` is changed, the existing BullMQ job is updated.
    *   **Response:** Updated target object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `400 Bad Request`

*   **`DELETE /api/targets/:targetId`**
    *   **Description:** Delete a target by ID. This also removes its scheduled job and associated scrape jobs/data.
    *   **Permissions:** `manageTargets` (admin, user - if target belongs to user)
    *   **Response:** `204 No Content`
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 4. Scrape Job Endpoints

*   **`POST /api/scrape-jobs`**
    *   **Description:** Manually create a scrape job *record* (not typically used to trigger a scrape, see `/:targetId/run`). Useful for admin to manage job history.
    *   **Permissions:** `manageScrapeJobs` (admin, user)
    *   **Request Body:**
        ```json
        {
          "targetId": "uuid_of_target",
          "triggeredBy": "uuid_of_user_or_system_string",
          "status": "pending" // Initial status
        }
        ```
    *   **Response:** Created scrape job object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`

*   **`POST /api/scrape-jobs/:targetId/run`**
    *   **Description:** Trigger an immediate scrape job for a specific target. Adds the job to the BullMQ queue.
    *   **Permissions:** `manageScrapeJobs` (admin, user)
    *   **Response:**
        ```json
        {
          "message": "Scrape job enqueued successfully.",
          "bullMqJobId": "bullmq_job_id",
          "targetId": "uuid_of_target"
        }
        ```
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (if target not found)

*   **`GET /api/scrape-jobs`**
    *   **Description:** Get all scrape jobs. Users see only their own jobs; admins see all.
    *   **Permissions:** `getScrapeJobs` (admin, user)
    *   **Query Parameters:** `page`, `limit`, `sortBy`, `targetId`, `status`
    *   **Response:** Paginated list of scrape job objects, including associated target name/url.
    *   **Error Codes:** `401 Unauthorized`

*   **`GET /api/scrape-jobs/:jobId`**
    *   **Description:** Get a single scrape job by ID.
    *   **Permissions:** `getScrapeJobs` (admin, user - if job belongs to user)
    *   **Response:** Scrape job object, including associated target name/url.
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

*   **`PATCH /api/scrape-jobs/:jobId`**
    *   **Description:** Update a scrape job (e.g., status). Primarily for internal use or admin overrides.
    *   **Permissions:** `manageScrapeJobs` (admin, user - if job belongs to user)
    *   **Request Body:** Partial scrape job object (e.g., `{"status": "completed"}`)
    *   **Response:** Updated scrape job object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `400 Bad Request`

*   **`DELETE /api/scrape-jobs/:jobId`**
    *   **Description:** Delete a scrape job by ID. Also deletes all associated scraped data.
    *   **Permissions:** `manageScrapeJobs` (admin, user - if job belongs to user)
    *   **Response:** `204 No Content`
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### 5. Scraped Data Endpoints

*   **`GET /api/scraped-data`**
    *   **Description:** Get all scraped data entries. This endpoint is cached.
    *   **Permissions:** `getScrapedData` (admin, user - filtered by their jobs/targets)
    *   **Query Parameters:** `page`, `limit`, `sortBy`
    *   **Response:** Paginated list of scraped data objects, including associated job and target details.
    *   **Error Codes:** `401 Unauthorized`

*   **`GET /api/scraped-data/:dataId`**
    *   **Description:** Get a single scraped data entry by its ID.
    *   **Permissions:** `getScrapedData` (admin, user - if data belongs to their job/target)
    *   **Response:** Scraped data object
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

*   **`GET /api/scraped-data/job/:jobId`**
    *   **Description:** Get all scraped data entries for a specific scrape job. This endpoint is cached.
    *   **Permissions:** `getScrapedData` (admin, user - if job belongs to them)
    *   **Query Parameters:** `page`, `limit`, `sortBy`
    *   **Response:** Paginated list of scraped data objects, associated with the given job.
    *   **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
```