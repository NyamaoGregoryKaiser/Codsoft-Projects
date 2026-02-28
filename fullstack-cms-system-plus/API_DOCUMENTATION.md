```markdown
# CMS Pro API Documentation (Conceptual)

This document provides a conceptual overview of the RESTful API endpoints for the CMS Pro backend. For a live, interactive documentation, a tool like **Swagger UI (OpenAPI)** would typically be integrated into the Spring Boot application.

**Base URL:** `http://localhost:8080/api/v1` (or your deployed backend URL)

---

## Authentication

Authentication is handled via JWT (JSON Web Tokens). Upon successful authentication, a JWT is returned, which must be included in the `Authorization` header of subsequent protected requests as `Bearer <token>`.

### 1. Register User

`POST /auth/register`

Registers a new user account.

**Request Body:** `application/json`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "role": "USER" // Optional: "ADMIN", "EDITOR", "USER". If omitted, defaults to "USER".
}
```

**Responses:**
*   `201 Created`: User registered successfully.
    ```json
    {
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "message": "User registered successfully"
    }
    ```
*   `400 Bad Request`: Invalid input or email already registered.
    ```json
    {
      "email": "Email already registered."
    }
    ```

### 2. Authenticate User

`POST /auth/authenticate`

Authenticates a user and returns JWTs.

**Request Body:** `application/json`
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Responses:**
*   `200 OK`: Authentication successful.
    ```json
    {
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "message": "Authentication successful"
    }
    ```
*   `400 Bad Request`: Invalid input (e.g., missing email/password).
*   `403 Forbidden`: Invalid credentials.

---

## Content Management

### 1. Get All Published Content

`GET /content/public`

Retrieves a paginated list of all published posts and pages. Publicly accessible.

**Query Parameters:**
*   `page` (int, default: 0): Page number (0-indexed).
*   `size` (int, default: 10): Number of items per page.
*   `sortBy` (string, default: `publishedAt`): Field to sort by (e.g., `publishedAt`, `title`, `createdAt`).

**Responses:**
*   `200 OK`:
    ```json
    {
      "content": [
        {
          "id": 1,
          "title": "The Future of AI",
          "slug": "the-future-of-ai",
          "body": "Artificial intelligence is rapidly evolving...",
          "featuredImage": null,
          "status": "PUBLISHED",
          "type": "POST",
          "authorId": 1,
          "authorName": "Admin User",
          "categoryId": 1,
          "categoryName": "Technology",
          "createdAt": "2023-04-23T10:00:00",
          "publishedAt": "2023-04-23T10:00:00",
          "updatedAt": null
        }
      ],
      "pageable": { ... },
      "totalPages": 1,
      "totalElements": 1,
      "last": true,
      "size": 10,
      "number": 0,
      "sort": { ... },
      "first": true,
      "numberOfElements": 1,
      "empty": false
    }
    ```

### 2. Get Published Content by Slug

`GET /content/public/{slug}`

Retrieves a single published content item by its URL-friendly slug. Publicly accessible.

**Path Parameters:**
*   `slug` (string, required): The slug of the content.

**Responses:**
*   `200 OK`: Returns the content details. (See response format for `GET /content/public` without the array wrapper).
*   `404 Not Found`: Content with the given slug and `PUBLISHED` status does not exist.

### 3. Get All Content (Admin/Editor)

`GET /content`

Retrieves a paginated list of all content items, including `DRAFT`, `PUBLISHED`, and `ARCHIVED` statuses. Requires `ADMIN` or `EDITOR` role.

**Query Parameters:** Same as `GET /content/public`. `sortBy` defaults to `createdAt`.

**Responses:**
*   `200 OK`: (Same format as `GET /content/public`)
*   `401 Unauthorized`: No JWT token provided or invalid.
*   `403 Forbidden`: User does not have `ADMIN` or `EDITOR` role.

### 4. Get Content by ID (Admin/Editor)

`GET /content/{id}`

Retrieves a single content item by its ID. Requires `ADMIN` or `EDITOR` role.

**Path Parameters:**
*   `id` (long, required): The ID of the content.

**Responses:**
*   `200 OK`: Returns the content details.
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `404 Not Found`: Content with the given ID does not exist.

### 5. Create Content (Admin/Editor)

`POST /content`

Creates a new content item. Requires `ADMIN` or `EDITOR` role.

**Request Body:** `application/json`
```json
{
  "title": "My New Article",
  "slug": "my-new-article", // Optional, will be auto-generated from title if not provided
  "body": "The detailed content of my article...",
  "featuredImage": "http://example.com/image.jpg", // Optional
  "status": "DRAFT", // "DRAFT", "PUBLISHED", "ARCHIVED" (defaults to DRAFT)
  "type": "POST", // "POST", "PAGE" (defaults to POST)
  "categoryId": 1 // Optional: ID of the category
}
```
*   `authorId` is automatically picked from the authenticated user's ID.

**Responses:**
*   `201 Created`: Content created successfully. Returns the created `ContentDTO`.
*   `400 Bad Request`: Invalid input (e.g., missing title, title/slug already exists, invalid category ID).
*   `401 Unauthorized`:
*   `403 Forbidden`:

### 6. Update Content (Admin/Editor/Author)

`PUT /content/{id}`

Updates an existing content item. Requires `ADMIN` or `EDITOR` role. An `EDITOR` can only update content they authored.

**Path Parameters:**
*   `id` (long, required): The ID of the content to update.

**Request Body:** `application/json` (Same as `POST /content`, all fields are optional for partial updates but typically a full DTO is sent).

**Responses:**
*   `200 OK`: Content updated successfully. Returns the updated `ContentDTO`.
*   `400 Bad Request`: Invalid input or conflict (e.g., new title/slug already exists).
*   `401 Unauthorized`:
*   `403 Forbidden`: User does not have permission (e.g., editor modifying content by another author).
*   `404 Not Found`: Content with the given ID does not exist.

### 7. Delete Content (Admin/Editor/Author)

`DELETE /content/{id}`

Deletes a content item. Requires `ADMIN` or `EDITOR` role. An `EDITOR` can only delete content they authored.

**Path Parameters:**
*   `id` (long, required): The ID of the content to delete.

**Responses:**
*   `204 No Content`: Content deleted successfully.
*   `401 Unauthorized`:
*   `403 Forbidden`: User does not have permission.
*   `404 Not Found`: Content with the given ID does not exist.

---

## Category Management

### 1. Get All Categories (Public)

`GET /categories`

Retrieves a list of all categories. Publicly accessible.

**Responses:**
*   `200 OK`:
    ```json
    [
      {
        "id": 1,
        "name": "Technology",
        "slug": "technology",
        "description": "Articles about software, hardware, and gadgets."
      },
      {
        "id": 2,
        "name": "Lifestyle",
        "slug": "lifestyle",
        "description": "Tips and guides for everyday living."
      }
    ]
    ```

### 2. Get Category by ID (Public)

`GET /categories/{id}`

Retrieves a single category by its ID. Publicly accessible.

**Path Parameters:**
*   `id` (long, required): The ID of the category.

**Responses:**
*   `200 OK`: Returns the category details.
*   `404 Not Found`: Category with the given ID does not exist.

### 3. Create Category (Admin/Editor)

`POST /categories`

Creates a new category. Requires `ADMIN` or `EDITOR` role.

**Request Body:** `application/json`
```json
{
  "name": "New Category",
  "description": "Description for the new category." // Optional
}
```

**Responses:**
*   `201 Created`: Category created successfully. Returns the created `CategoryDTO`.
*   `400 Bad Request`: Invalid input or category name already exists.
*   `401 Unauthorized`:
*   `403 Forbidden`:

### 4. Update Category (Admin/Editor)

`PUT /categories/{id}`

Updates an existing category. Requires `ADMIN` or `EDITOR` role.

**Path Parameters:**
*   `id` (long, required): The ID of the category to update.

**Request Body:** `application/json` (Same as `POST /categories`).

**Responses:**
*   `200 OK`: Category updated successfully. Returns the updated `CategoryDTO`.
*   `400 Bad Request`: Invalid input or new category name already exists.
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `404 Not Found`: Category with the given ID does not exist.

### 5. Delete Category (Admin)

`DELETE /categories/{id}`

Deletes a category. **Requires `ADMIN` role.**

**Path Parameters:**
*   `id` (long, required): The ID of the category to delete.

**Responses:**
*   `204 No Content`: Category deleted successfully.
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `404 Not Found`: Category with the given ID does not exist.

---

## Media Management

### 1. Upload File (Admin/Editor)

`POST /media/upload`

Uploads a new media file. Requires `ADMIN` or `EDITOR` role.

**Request Body:** `multipart/form-data`
*   `file` (file, required): The file to upload.

**Responses:**
*   `201 Created`: File uploaded successfully.
    ```json
    {
      "id": 1,
      "fileName": "unique-uuid.jpg",
      "fileType": "image/jpeg",
      "url": "/uploads/unique-uuid.jpg",
      "altText": "original-filename.jpg",
      "fileSize": 123456,
      "uploadedAt": "2023-04-23T11:00:00"
    }
    ```
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `500 Internal Server Error`: Failed to store file.

### 2. Get All Media (Admin/Editor)

`GET /media`

Retrieves a list of all uploaded media items. Requires `ADMIN` or `EDITOR` role.

**Responses:**
*   `200 OK`: Returns a list of media items.
*   `401 Unauthorized`:
*   `403 Forbidden`:

### 3. Get Media by ID (Admin/Editor)

`GET /media/{id}`

Retrieves a single media item by its ID. Requires `ADMIN` or `EDITOR` role.

**Path Parameters:**
*   `id` (long, required): The ID of the media item.

**Responses:**
*   `200 OK`: Returns the media item details.
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `404 Not Found`: Media item with the given ID does not exist.

### 4. Delete Media (Admin)

`DELETE /media/{id}`

Deletes a media item and its corresponding file from storage. **Requires `ADMIN` role.**

**Path Parameters:**
*   `id` (long, required): The ID of the media item to delete.

**Responses:**
*   `204 No Content`: Media item deleted successfully.
*   `401 Unauthorized`:
*   `403 Forbidden`:
*   `404 Not Found`: Media item with the given ID does not exist.
*   `500 Internal Server Error`: Failed to delete the file from storage.

### 5. Serve Uploaded Files (Public)

`GET /media/uploads/{filename}`

Serves uploaded media files directly. Publicly accessible.

**Path Parameters:**
*   `filename` (string, required): The file name of the media item.

**Responses:**
*   `200 OK`: Returns the file content.
*   `404 Not Found`: File does not exist.

---

**Note:** Error responses for validation failures (`400 Bad Request` for `MethodArgumentNotValidException`) typically return a map of field names to error messages. Other errors (e.g., `ResourceNotFoundException`, `IllegalArgumentException`, `Exception`) return a standardized `ErrorDetails` object as defined in `GlobalExceptionHandler`.
```