```markdown
# API Documentation

This document outlines the RESTful API endpoints for the E-commerce system.
All API endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api` (or your deployed backend URL)

---

## Authentication

### 1. Register User
-   **Endpoint:** `/auth/register`
-   **Method:** `POST`
-   **Description:** Creates a new user account.
-   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "StrongPassword123"
    }
    ```
-   **Responses:**
    -   `201 Created`:
        ```json
        {
          "user": {
            "id": "uuid-of-user",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "USER"
          },
          "token": "jwt-token-string"
        }
        ```
    -   `400 Bad Request`: If email already exists or invalid data.
        ```json
        {
          "code": 400,
          "message": "User with this email already exists"
        }
        ```

### 2. Login User
-   **Endpoint:** `/auth/login`
-   **Method:** `POST`
-   **Description:** Authenticates a user and returns a JWT token.
-   **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "StrongPassword123"
    }
    ```
-   **Responses:**
    -   `200 OK`:
        ```json
        {
          "user": {
            "id": "uuid-of-user",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "USER"
          },
          "token": "jwt-token-string"
        }
        ```
    -   `401 Unauthorized`: If invalid email or password.
        ```json
        {
          "code": 401,
          "message": "Invalid email or password"
        }
        ```
-   **Rate Limiting:** This endpoint has a rate limit of 10 requests per 15 minutes per IP.

### 3. Get User Profile
-   **Endpoint:** `/auth/profile`
-   **Method:** `GET`
-   **Description:** Retrieves the profile of the authenticated user.
-   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
-   **Responses:**
    -   `200 OK`:
        ```json
        {
          "id": "uuid-of-user",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "role": "USER",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:00:00.000Z"
        }
        ```
    -   `401 Unauthorized`: If no token or invalid token.

### 4. Update User Profile
-   **Endpoint:** `/auth/profile`
-   **Method:** `PUT`
-   **Description:** Updates the profile of the authenticated user.
-   **Headers:** `Authorization: Bearer <JWT_TOKEN>`
-   **Request Body (Partial):**
    ```json
    {
      "name": "Johnny D.",
      "password": "NewStrongPassword123"
    }
    ```
-   **Responses:**
    -   `200 OK`: Returns the updated user profile.
    -   `401 Unauthorized`: If no token or invalid token.
    -   `400 Bad Request`: If invalid update data.

---

## Products

### 1. Create Product
-   **Endpoint:** `/products`
-   **Method:** `POST`
-   **Description:** Creates a new product. (Admin only)
-   **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
-   **Request Body:**
    ```json
    {
      "name": "New Awesome Gadget",
      "description": "A very detailed description of the gadget.",
      "price": 49.99,
      "imageUrl": "http://example.com/gadget.jpg",
      "category": "Electronics",
      "brand": "TechCorp",
      "stock": 100
    }
    ```
-   **Responses:**
    -   `201 Created`: Returns the created product object.
    -   `400 Bad Request`: If invalid product data.
    -   `401 Unauthorized`: If no token or invalid token.
    -   `403 Forbidden`: If user is not an ADMIN.

### 2. Get All Products
-   **Endpoint:** `/products`
-   **Method:** `GET`
-   **Description:** Retrieves a list of all products with optional filtering, searching, and pagination.
-   **Query Parameters:**
    -   `search` (string, optional): Text to search in product names and descriptions.
    -   `category` (string, optional): Filter by product category.
    -   `brand` (string, optional): Filter by product brand.
    -   `minPrice` (number, optional): Minimum price.
    -   `maxPrice` (number, optional): Maximum price.
    -   `page` (number, optional, default: 1): Page number for pagination.
    -   `limit` (number, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: `createdAt`): Field to sort by (e.g., `name`, `price`, `createdAt`).
    -   `sortOrder` (string, optional, default: `desc`): Sort order (`asc` or `desc`).
-   **Responses:**
    -   `200 OK`:
        ```json
        {
          "products": [
            { "id": "uuid-1", "name": "Product A", "price": 10.00, ... },
            { "id": "uuid-2", "name": "Product B", "price": 20.00, ... }
          ],
          "total": 50,
          "page": 1,
          "limit": 10
        }
        ```

### 3. Get Product by ID
-   **Endpoint:** `/products/:productId`
-   **Method:** `GET`
-   **Description:** Retrieves a single product by its ID.
-   **Path Parameters:**
    -   `productId` (string, required): The ID of the product.
-   **Responses:**
    -   `200 OK`: Returns the product object.
    -   `404 Not Found`: If product does not exist.

### 4. Update Product
-   **Endpoint:** `/products/:productId`
-   **Method:** `PUT`
-   **Description:** Updates an existing product. (Admin only)
-   **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
-   **Path Parameters:**
    -   `productId` (string, required): The ID of the product.
-   **Request Body (Partial):**
    ```json
    {
      "price": 55.00,
      "stock": 120
    }
    ```
-   **Responses:**
    -   `200 OK`: Returns the updated product object.
    -   `400 Bad Request`: If invalid product data.
    -   `401 Unauthorized`: If no token or invalid token.
    -   `403 Forbidden`: If user is not an ADMIN.
    -   `404 Not Found`: If product does not exist.

### 5. Delete Product
-   **Endpoint:** `/products/:productId`
-   **Method:** `DELETE`
-   **Description:** Deletes a product. (Admin only)
-   **Headers:** `Authorization: Bearer <ADMIN_JWT_TOKEN>`
-   **Path Parameters:**
    -   `productId` (string, required): The ID of the product.
-   **Responses:**
    -   `204 No Content`: Product deleted successfully.
    -   `401 Unauthorized`: If no token or invalid token.
    -   `403 Forbidden`: If user is not an ADMIN.
    -   `404 Not Found`: If product does not exist.

---

## Error Responses

All error responses follow a consistent structure:

```json
{
  "code": 404,
  "message": "Not found",
  "stack": "..." // Only in development environment
}
```

-   `code`: HTTP status code of the error.
-   `message`: A user-friendly description of the error.
-   `stack`: (Only in `development` environment) The stack trace for debugging purposes.

Common error codes include:
-   `400 Bad Request`: Invalid input data (e.g., validation errors).
-   `401 Unauthorized`: Authentication failed (e.g., missing or invalid token).
-   `403 Forbidden`: User does not have permission to access the resource.
-   `404 Not Found`: The requested resource does not exist.
-   `429 Too Many Requests`: Rate limit exceeded.
-   `500 Internal Server Error`: An unexpected error occurred on the server.

---
```