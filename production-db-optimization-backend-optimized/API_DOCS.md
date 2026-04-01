```markdown
# CppDBOptimizer - Product Catalog Management System API Documentation

This document provides detailed information about the RESTful API endpoints exposed by the CppDBOptimizer backend.

**Base URL**: `/api/v1` (when accessed directly) or `http://localhost:80/api/v1` (when proxied via Nginx in Docker setup).

**Content Type**: All request bodies and responses are `application/json`.

## Authentication

Authentication is performed using JSON Web Tokens (JWT). Users register and log in to obtain a token, which must be included in the `Authorization` header for all protected routes.

### `POST /auth/register`

Registers a new user.

-   **Request Body**:
    ```json
    {
        "username": "newuser",
        "password": "securepassword123"
    }
    ```
-   **Responses**:
    -   `201 Created`:
        ```json
        {
            "message": "User registered successfully",
            "userId": 123,
            "username": "newuser"
        }
        ```
    -   `400 Bad Request`: If username/password are missing or invalid.
    -   `409 Conflict`: If username already exists.
    -   `500 Internal Server Error`: For other server-side issues.

### `POST /auth/login`

Authenticates a user and returns a JWT token.

-   **Request Body**:
    ```json
    {
        "username": "existinguser",
        "password": "correctpassword"
    }
    ```
-   **Responses**:
    -   `200 OK`:
        ```json
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaXNzIjoiY3BwZGJvcHRpbWl6ZXIiLCJleHAiOjE2NzgwNTg3NDR9.signature",
            "expiresIn": 3600 // Seconds
        }
        ```
    -   `400 Bad Request`: If username/password are missing.
    -   `401 Unauthorized`: If credentials are invalid.
    -   `500 Internal Server Error`: For other server-side issues.

**Protected Routes**: All routes under `/products`, `/categories`, `/manufacturers` require an `Authorization` header with a valid Bearer Token:
`Authorization: Bearer <your_jwt_token>`

## Products

### `POST /products` (Protected)

Creates a new product.

-   **Request Body**:
    ```json
    {
        "name": "New Product Name",
        "description": "A detailed description of the product.",
        "price": 29.99,
        "category_id": 1,
        "manufacturer_id": 1
    }
    ```
-   **Responses**:
    -   `201 Created`: Returns the created product object with its generated `id` and `created_at`.
    -   `400 Bad Request`: Invalid input (e.g., missing name, invalid price).
    -   `401 Unauthorized`: Missing or invalid token.
    -   `500 Internal Server Error`.

### `GET /products` (Protected)

Retrieves a list of products with optional filtering and pagination.

-   **Query Parameters**:
    -   `name` (optional): Filter by product name (case-insensitive, partial match).
    -   `categoryId` (optional): Filter by category ID.
    -   `manufacturerId` (optional): Filter by manufacturer ID.
    -   `minPrice` (optional): Filter by minimum price.
    -   `maxPrice` (optional): Filter by maximum price.
    -   `limit` (optional, default: 10): Maximum number of products to return.
    -   `offset` (optional, default: 0): Number of products to skip.
-   **Example Request**: `GET /api/v1/products?name=laptop&categoryId=1&minPrice=500&limit=5`
-   **Responses**:
    -   `200 OK`: Returns an array of product objects.
        ```json
        [
            {
                "id": 1,
                "name": "Laptop Pro X",
                "description": "...",
                "price": 1200.00,
                "category_id": 1,
                "manufacturer_id": 1,
                "created_at": "...",
                "category_name": "Electronics",
                "manufacturer_name": "TechCorp"
            }
        ]
        ```
    -   `401 Unauthorized`: Missing or invalid token.
    -   `400 Bad Request`: Invalid query parameter format.
    -   `500 Internal Server Error`.

### `GET /products/:id` (Protected)

Retrieves a single product by its ID.

-   **Path Parameters**: `id` (long long) - The ID of the product.
-   **Example Request**: `GET /api/v1/products/1`
-   **Responses**:
    -   `200 OK`: Returns the product object.
    -   `404 Not Found`: If no product with the given ID exists.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `400 Bad Request`: Invalid ID format.
    -   `500 Internal Server Error`.

### `PUT /products/:id` (Protected)

Updates an existing product.

-   **Path Parameters**: `id` (long long) - The ID of the product to update.
-   **Request Body**: (Same structure as `POST /products`, include fields to update)
    ```json
    {
        "name": "Updated Product Name",
        "price": 35.50
    }
    ```
-   **Responses**:
    -   `200 OK`: Returns the updated product object.
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `404 Not Found`: If product does not exist.
    -   `500 Internal Server Error`.

### `DELETE /products/:id` (Protected)

Deletes a product by its ID.

-   **Path Parameters**: `id` (long long) - The ID of the product to delete.
-   **Example Request**: `DELETE /api/v1/products/1`
-   **Responses**:
    -   `204 No Content`: Product successfully deleted.
    -   `404 Not Found`: If product does not exist.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `400 Bad Request`: Invalid ID format.
    -   `500 Internal Server Error`.

## Categories

### `POST /categories` (Protected)

Creates a new category.

-   **Request Body**:
    ```json
    {
        "name": "New Category",
        "description": "Category for new items."
    }
    ```
-   **Responses**:
    -   `201 Created`: Returns the created category object.
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`.
    -   `409 Conflict`: Category name already exists.
    -   `500 Internal Server Error`.

### `GET /categories` (Protected)

Retrieves all categories. (This endpoint leverages the in-memory cache).

-   **Responses**:
    -   `200 OK`: Returns an array of category objects.
    -   `401 Unauthorized`.
    -   `500 Internal Server Error`.

### `GET /categories/:id` (Protected)

Retrieves a single category by its ID. (This endpoint leverages the in-memory cache).

-   **Path Parameters**: `id` (long long) - The ID of the category.
-   **Responses**:
    -   `200 OK`: Returns the category object.
    -   `404 Not Found`.
    -   `401 Unauthorized`.
    -   `400 Bad Request`.
    -   `500 Internal Server Error`.

### `PUT /categories/:id` (Protected)

Updates an existing category. Invalidates cache for this category.

-   **Path Parameters**: `id` (long long)
-   **Request Body**:
    ```json
    {
        "name": "Updated Category Name",
        "description": "Updated description."
    }
    ```
-   **Responses**:
    -   `200 OK`: Returns the updated category object.
    -   `400 Bad Request`.
    -   `401 Unauthorized`.
    -   `404 Not Found`.
    -   `409 Conflict`: New name already exists.
    -   `500 Internal Server Error`.

### `DELETE /categories/:id` (Protected)

Deletes a category by its ID. Invalidates cache for this category.

-   **Path Parameters**: `id` (long long)
-   **Responses**:
    -   `204 No Content`.
    -   `404 Not Found`.
    -   `401 Unauthorized`.
    -   `400 Bad Request`.
    -   `500 Internal Server Error`.

## Manufacturers

### `POST /manufacturers` (Protected)

Creates a new manufacturer.

-   **Request Body**:
    ```json
    {
        "name": "New Manufacturer Inc.",
        "country": "Germany",
        "website": "http://www.newmanu.com"
    }
    ```
-   **Responses**:
    -   `201 Created`: Returns the created manufacturer object.
    -   `400 Bad Request`.
    -   `401 Unauthorized`.
    -   `409 Conflict`: Manufacturer name already exists.
    -   `500 Internal Server Error`.

### `GET /manufacturers` (Protected)

Retrieves all manufacturers. (This endpoint leverages the in-memory cache).

-   **Responses**:
    -   `200 OK`: Returns an array of manufacturer objects.
    -   `401 Unauthorized`.
    -   `500 Internal Server Error`.

### `GET /manufacturers/:id` (Protected)

Retrieves a single manufacturer by its ID. (This endpoint leverages the in-memory cache).

-   **Path Parameters**: `id` (long long)
-   **Responses**:
    -   `200 OK`: Returns the manufacturer object.
    -   `404 Not Found`.
    -   `401 Unauthorized`.
    -   `400 Bad Request`.
    -   `500 Internal Server Error`.

### `PUT /manufacturers/:id` (Protected)

Updates an existing manufacturer. Invalidates cache for this manufacturer.

-   **Path Parameters**: `id` (long long)
-   **Request Body**:
    ```json
    {
        "name": "Updated Manufacturer Co.",
        "country": "France"
    }
    ```
-   **Responses**:
    -   `200 OK`: Returns the updated manufacturer object.
    -   `400 Bad Request`.
    -   `401 Unauthorized`.
    -   `404 Not Found`.
    -   `409 Conflict`: New name already exists.
    -   `500 Internal Server Error`.

### `DELETE /manufacturers/:id` (Protected)

Deletes a manufacturer by its ID. Invalidates cache for this manufacturer.

-   **Path Parameters**: `id` (long long)
-   **Responses**:
    -   `204 No Content`.
    -   `404 Not Found`.
    -   `401 Unauthorized`.
    -   `400 Bad Request`.
    -   `500 Internal Server Error`.

## General Error Responses

In case of an error, the API will return a JSON object with an `error` field and an appropriate HTTP status code.

```json
{
    "error": "A descriptive error message."
}
```
```