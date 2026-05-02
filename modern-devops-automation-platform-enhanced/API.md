```markdown
# API Documentation

This document describes the RESTful API endpoints for the DevOps Automation System backend.

**Base URL**: `/api` (e.g., `http://localhost:5000/api` for local development)

## Authentication

All protected routes require a JWT token in the `Authorization` header as `Bearer <JWT_TOKEN>`.

### 1. Register User

*   **Endpoint**: `POST /auth/register`
*   **Description**: Creates a new user account.
*   **Request Body**: `application/json`
    ```json
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongpassword123"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
        "id": "uuid-of-new-user",
        "username": "newuser",
        "email": "newuser@example.com",
        "role": "user",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Error Responses**:
    *   `409 Conflict`: If a user with the given email already exists.
    *   `400 Bad Request`: If validation fails (e.g., invalid email format, missing fields).

### 2. Login User

*   **Endpoint**: `POST /auth/login`
*   **Description**: Authenticates a user and returns a JWT token.
*   **Request Body**: `application/json`
    ```json
    {
        "email": "existing@example.com",
        "password": "correctpassword"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
        "id": "uuid-of-user",
        "username": "existinguser",
        "email": "existing@example.com",
        "role": "user",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If email or password is incorrect.

### 3. Get User Profile

*   **Endpoint**: `GET /auth/profile`
*   **Description**: Retrieves the profile information of the authenticated user.
*   **Authorization**: **Protected** (requires JWT token).
*   **Request Headers**:
    ```
    Authorization: Bearer <JWT_TOKEN>
    ```
*   **Response (200 OK)**:
    ```json
    {
        "id": "uuid-of-user",
        "username": "existinguser",
        "email": "existing@example.com",
        "role": "user"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no token is provided or the token is invalid/expired.

## Products

### 1. Get All Products

*   **Endpoint**: `GET /products`
*   **Description**: Retrieves a list of all products. Supports pagination, search, filtering by price, and sorting. This endpoint is **cached** for 1 hour by default.
*   **Authorization**: Optional (if token provided, includes `owner` details).
*   **Query Parameters**:
    *   `page`: (Optional) Page number (default: `1`).
    *   `limit`: (Optional) Number of items per page (default: `10`).
    *   `search`: (Optional) Case-insensitive search string for product `name` or `description`.
    *   `minPrice`: (Optional) Minimum price for filtering.
    *   `maxPrice`: (Optional) Maximum price for filtering.
    *   `sortBy`: (Optional) Field to sort by (e.g., `name`, `price`, `createdAt`, `updatedAt`).
    *   `sortOrder`: (Optional) Sort order (`ASC` or `DESC`, default: `DESC`).
*   **Example Request**: `GET /products?page=1&limit=5&search=laptop&minPrice=1000&sortBy=price&sortOrder=ASC`
*   **Response (200 OK)**:
    ```json
    {
        "count": 2,
        "rows": [
            {
                "id": "uuid-product-1",
                "name": "Laptop Pro X",
                "description": "Powerful laptop for professionals.",
                "price": "1200.00",
                "stock": 50,
                "userId": "uuid-admin-user",
                "createdAt": "2023-10-27T10:00:00.000Z",
                "updatedAt": "2023-10-27T10:00:00.000Z",
                "owner": {
                    "id": "uuid-admin-user",
                    "username": "admin",
                    "email": "admin@example.com"
                }
            },
            {
                "id": "uuid-product-2",
                "name": "Another Laptop",
                "description": "Mid-range laptop.",
                "price": "1050.00",
                "stock": 20,
                "userId": "uuid-regular-user",
                "createdAt": "2023-10-27T11:00:00.000Z",
                "updatedAt": "2023-10-27T11:00:00.000Z",
                "owner": {
                    "id": "uuid-regular-user",
                    "username": "testuser",
                    "email": "user@example.com"
                }
            }
        ]
    }
    ```

### 2. Get Product by ID

*   **Endpoint**: `GET /products/:id`
*   **Description**: Retrieves a single product by its unique ID. This endpoint is **cached** for 1 hour by default.
*   **Authorization**: Optional.
*   **URL Parameters**:
    *   `id`: The UUID of the product.
*   **Example Request**: `GET /products/uuid-product-1`
*   **Response (200 OK)**:
    ```json
    {
        "id": "uuid-product-1",
        "name": "Laptop Pro X",
        "description": "Powerful laptop for professionals.",
        "price": "1200.00",
        "stock": 50,
        "userId": "uuid-admin-user",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T10:00:00.000Z",
        "owner": {
            "id": "uuid-admin-user",
            "username": "admin",
            "email": "admin@example.com"
        }
    }
    ```
*   **Error Responses**:
    *   `404 Not Found`: If no product with the given ID exists.

### 3. Create Product

*   **Endpoint**: `POST /products`
*   **Description**: Creates a new product. Requires authentication.
*   **Authorization**: **Protected** (`user`, `admin` roles).
*   **Request Body**: `application/json`
    ```json
    {
        "name": "New Awesome Gadget",
        "description": "A detailed description of the gadget.",
        "price": 299.99,
        "stock": 100
    }
    ```
*   **Response (201 Created)**: Returns the newly created product object.
    ```json
    {
        "id": "uuid-new-product",
        "name": "New Awesome Gadget",
        "description": "A detailed description of the gadget.",
        "price": "299.99",
        "stock": 100,
        "userId": "uuid-authenticated-user",
        "createdAt": "2023-10-27T12:00:00.000Z",
        "updatedAt": "2023-10-27T12:00:00.000Z"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no token is provided or invalid.
    *   `403 Forbidden`: If authenticated user does not have `user` or `admin` role.
    *   `400 Bad Request`: If validation fails (e.g., missing `name`, `price`).

### 4. Update Product

*   **Endpoint**: `PUT /products/:id`
*   **Description**: Updates an existing product by its ID. Requires authentication and specific authorization.
*   **Authorization**: **Protected** (`user` role must be the product owner, `admin` role can update any product).
*   **URL Parameters**:
    *   `id`: The UUID of the product to update.
*   **Request Body**: `application/json` (partial update is allowed)
    ```json
    {
        "name": "Updated Gadget Name",
        "price": 279.99
    }
    ```
*   **Response (200 OK)**: Returns the updated product object.
    ```json
    {
        "id": "uuid-existing-product",
        "name": "Updated Gadget Name",
        "description": "A detailed description of the gadget.",
        "price": "279.99",
        "stock": 100,
        "userId": "uuid-product-owner",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "updatedAt": "2023-10-27T13:00:00.000Z"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no token is provided or invalid.
    *   `403 Forbidden`: If authenticated user is not the owner or an admin.
    *   `404 Not Found`: If no product with the given ID exists.
    *   `400 Bad Request`: If validation fails.

### 5. Delete Product

*   **Endpoint**: `DELETE /products/:id`
*   **Description**: Deletes a product by its ID. Requires authentication and specific authorization.
*   **Authorization**: **Protected** (`user` role must be the product owner, `admin` role can delete any product).
*   **URL Parameters**:
    *   `id`: The UUID of the product to delete.
*   **Response (200 OK)**:
    ```json
    {
        "message": "Product deleted successfully"
    }
    ```
*   **Error Responses**:
    *   `401 Unauthorized`: If no token is provided or invalid.
    *   `403 Forbidden`: If authenticated user is not the owner or an admin.
    *   `404 Not Found`: If no product with the given ID exists.

---

## Error Handling

General error structure for non-2xx responses:

```json
{
    "message": "Error message details",
    "stack": "Stack trace (only in development/test environments)"
}
```

Common error status codes:
*   `400 Bad Request`: Invalid input, validation errors.
*   `401 Unauthorized`: Authentication failed (missing/invalid token).
*   `403 Forbidden`: Authorization failed (insufficient permissions).
*   `404 Not Found`: Resource not found.
*   `409 Conflict`: Resource already exists (e.g., duplicate email during registration).
*   `429 Too Many Requests`: Rate limit exceeded.
*   `500 Internal Server Error`: Unexpected server error.
```