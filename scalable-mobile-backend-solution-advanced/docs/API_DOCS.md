```markdown
# Mobile Backend API Documentation

This document describes the RESTful API endpoints provided by the Mobile Backend.

## Base URL

`http://localhost:8080/api/v1` (adjust port if different)

## Authentication

All authenticated endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token:

`Authorization: Bearer <your_jwt_token>`

## Error Handling

Errors are returned in a consistent JSON format:

```json
{
  "code": <code>,         // HTTP status code (e.g., 400, 401, 404, 500)
  "message": "<error_description>" // A human-readable error message
}
```

## 1. Authentication Endpoints

### 1.1. Register User

`POST /auth/register`

Registers a new user account.

-   **Request Body**: `application/json`
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "securepassword123"
    }
    ```
-   **Responses**:
    -   `201 Created`: User registered successfully.
        ```json
        {
          "message": "User registered successfully",
          "user_id": "uuid_of_new_user",
          "token": "generated_jwt_token"
        }
        ```
    -   `400 Bad Request`: Invalid input (e.g., missing fields, weak password).
    -   `409 Conflict`: User with this email or username already exists.
    -   `500 Internal Server Error`: Server-side error.

### 1.2. Login User

`POST /auth/login`

Authenticates a user and returns a JWT.

-   **Request Body**: `application/json`
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
-   **Responses**:
    -   `200 OK`: Login successful.
        ```json
        {
          "message": "Login successful",
          "user_id": "uuid_of_user",
          "token": "generated_jwt_token"
        }
        ```
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`: Invalid credentials.
    -   `500 Internal Server Error`: Server-side error.

## 2. User Management Endpoints

**Requires Authentication**

### 2.1. Get All Users (Admin only)

`GET /users`

Retrieves a list of all registered users. Admin access required.

-   **Query Parameters**:
    -   `limit`: (Optional) Max number of users to return (default: 10).
    -   `offset`: (Optional) Number of users to skip (default: 0).
-   **Responses**:
    -   `200 OK`: List of users.
        ```json
        [
          {
            "id": "uuid",
            "username": "user1",
            "email": "user1@example.com",
            "created_at": "timestamp",
            "updated_at": "timestamp"
          },
          ...
        ]
        ```
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: User does not have sufficient permissions.
    -   `500 Internal Server Error`: Server-side error.

### 2.2. Get User by ID

`GET /users/:id`

Retrieves a single user by their ID. Users can only fetch their own profile unless they are an admin.

-   **URL Parameters**:
    -   `id`: UUID of the user.
-   **Responses**:
    -   `200 OK`: User data.
        ```json
        {
          "id": "uuid",
          "username": "user1",
          "email": "user1@example.com",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to view this user's profile.
    -   `404 Not Found`: User not found.
    -   `500 Internal Server Error`: Server-side error.

### 2.3. Update User (Partial)

`PATCH /users/:id`

Updates an existing user's details. Users can only update their own profile unless they are an admin.

-   **URL Parameters**:
    -   `id`: UUID of the user.
-   **Request Body**: `application/json`
    ```json
    {
      "username": "updated_username",
      "email": "updated_email@example.com",
      "password": "new_secure_password"
    }
    ```
    (Any combination of fields can be provided)
-   **Responses**:
    -   `200 OK`: User updated successfully.
        ```json
        {
          "message": "User updated successfully"
        }
        ```
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to update this user.
    -   `404 Not Found`: User not found.
    -   `409 Conflict`: Email or username already taken.
    -   `500 Internal Server Error`: Server-side error.

### 2.4. Delete User (Admin only)

`DELETE /users/:id`

Deletes a user account. Admin access required.

-   **URL Parameters**:
    -   `id`: UUID of the user.
-   **Responses**:
    -   `204 No Content`: User deleted successfully.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to delete users.
    -   `404 Not Found`: User not found.
    -   `500 Internal Server Error`: Server-side error.

## 3. Product Management Endpoints

**Requires Authentication for all except `GET /products` and `GET /products/:id` (which can be public)**

### 3.1. Get All Products

`GET /products`

Retrieves a list of all available products. Can be accessed publicly or by authenticated users.

-   **Query Parameters**:
    -   `limit`: (Optional) Max number of products to return (default: 10).
    -   `offset`: (Optional) Number of products to skip (default: 0).
-   **Responses**:
    -   `200 OK`: List of products.
        ```json
        [
          {
            "id": "uuid",
            "name": "Product A",
            "description": "Description of Product A",
            "price": 19.99,
            "stock_quantity": 100,
            "created_at": "timestamp",
            "updated_at": "timestamp"
          },
          ...
        ]
        ```
    -   `500 Internal Server Error`: Server-side error.

### 3.2. Get Product by ID

`GET /products/:id`

Retrieves a single product by its ID. Can be accessed publicly or by authenticated users.

-   **URL Parameters**:
    -   `id`: UUID of the product.
-   **Responses**:
    -   `200 OK`: Product data.
        ```json
        {
          "id": "uuid",
          "name": "Product A",
          "description": "Description of Product A",
          "price": 19.99,
          "stock_quantity": 100,
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    -   `404 Not Found`: Product not found.
    -   `500 Internal Server Error`: Server-side error.

### 3.3. Create Product (Admin only)

`POST /products`

Creates a new product. Admin access required.

-   **Request Body**: `application/json`
    ```json
    {
      "name": "New Product",
      "description": "Detailed description.",
      "price": 99.99,
      "stock_quantity": 50
    }
    ```
-   **Responses**:
    -   `201 Created`: Product created successfully.
        ```json
        {
          "message": "Product created successfully",
          "product_id": "uuid_of_new_product"
        }
        ```
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to create products.
    -   `409 Conflict`: Product with this name already exists.
    -   `500 Internal Server Error`: Server-side error.

### 3.4. Update Product (Admin only)

`PATCH /products/:id`

Updates an existing product's details. Admin access required.

-   **URL Parameters**:
    -   `id`: UUID of the product.
-   **Request Body**: `application/json`
    ```json
    {
      "name": "Updated Product Name",
      "price": 109.99
    }
    ```
    (Any combination of fields can be provided)
-   **Responses**:
    -   `200 OK`: Product updated successfully.
        ```json
        {
          "message": "Product updated successfully"
        }
        ```
    -   `400 Bad Request`: Invalid input.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to update products.
    -   `404 Not Found`: Product not found.
    -   `409 Conflict`: Product name already exists.
    -   `500 Internal Server Error`: Server-side error.

### 3.5. Delete Product (Admin only)

`DELETE /products/:id`

Deletes a product. Admin access required.

-   **URL Parameters**:
    -   `id`: UUID of the product.
-   **Responses**:
    -   `204 No Content`: Product deleted successfully.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to delete products.
    -   `404 Not Found`: Product not found.
    -   `409 Conflict`: Product is part of an existing order.
    -   `500 Internal Server Error`: Server-side error.

## 4. Order Management Endpoints

**Requires Authentication**

### 4.1. Get All Orders (Admin only, or User's own orders)

`GET /orders`

Retrieves a list of all orders. Admin users see all orders; regular users only see their own orders.

-   **Query Parameters**:
    -   `limit`: (Optional) Max number of orders to return (default: 10).
    -   `offset`: (Optional) Number of orders to skip (default: 0).
-   **Responses**:
    -   `200 OK`: List of orders.
        ```json
        [
          {
            "id": "uuid",
            "user_id": "user_uuid",
            "order_date": "timestamp",
            "total_amount": 120.00,
            "status": "pending",
            "items": [
              {
                "item_id": "uuid",
                "product_id": "product_uuid",
                "product_name": "Product A",
                "quantity": 2,
                "price_at_purchase": 50.00
              }
            ],
            "created_at": "timestamp",
            "updated_at": "timestamp"
          },
          ...
        ]
        ```
    -   `401 Unauthorized`: Missing or invalid token.
    -   `500 Internal Server Error`: Server-side error.

### 4.2. Get Order by ID

`GET /orders/:id`

Retrieves a single order by its ID. Users can only fetch their own orders unless they are an admin.

-   **URL Parameters**:
    -   `id`: UUID of the order.
-   **Responses**:
    -   `200 OK`: Order data with items.
        ```json
        {
          "id": "uuid",
          "user_id": "user_uuid",
          "order_date": "timestamp",
          "total_amount": 120.00,
          "status": "pending",
          "items": [
            {
              "item_id": "uuid",
              "product_id": "product_uuid",
              "product_name": "Product A",
              "quantity": 2,
              "price_at_purchase": 50.00
            }
          ],
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to view this order.
    -   `404 Not Found`: Order not found.
    -   `500 Internal Server Error`: Server-side error.

### 4.3. Create Order

`POST /orders`

Creates a new order for the authenticated user.

-   **Request Body**: `application/json`
    ```json
    {
      "items": [
        {
          "product_id": "uuid_of_product_a",
          "quantity": 2
        },
        {
          "product_id": "uuid_of_product_b",
          "quantity": 1
        }
      ]
    }
    ```
-   **Responses**:
    -   `201 Created`: Order created successfully.
        ```json
        {
          "message": "Order created successfully",
          "order_id": "uuid_of_new_order",
          "total_amount": 150.00,
          "status": "pending"
        }
        ```
    -   `400 Bad Request`: Invalid input (e.g., missing items, invalid product IDs, insufficient stock).
    -   `401 Unauthorized`: Missing or invalid token.
    -   `500 Internal Server Error`: Server-side error.

### 4.4. Update Order Status (Admin only)

`PATCH /orders/:id/status`

Updates the status of an existing order. Admin access required.

-   **URL Parameters**:
    -   `id`: UUID of the order.
-   **Request Body**: `application/json`
    ```json
    {
      "status": "shipped"
    }
    ```
    (Valid statuses: 'pending', 'processed', 'shipped', 'delivered', 'cancelled')
-   **Responses**:
    -   `200 OK`: Order status updated successfully.
        ```json
        {
          "message": "Order status updated successfully",
          "order_id": "uuid",
          "new_status": "shipped"
        }
        ```
    -   `400 Bad Request`: Invalid status provided.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to update order status.
    -   `404 Not Found`: Order not found.
    -   `500 Internal Server Error`: Server-side error.

### 4.5. Delete Order (Admin only)

`DELETE /orders/:id`

Deletes an order and its associated items. Admin access required.

-   **URL Parameters**:
    -   `id`: UUID of the order.
-   **Responses**:
    -   `204 No Content`: Order deleted successfully.
    -   `401 Unauthorized`: Missing or invalid token.
    -   `403 Forbidden`: Not authorized to delete orders.
    -   `404 Not Found`: Order not found.
    -   `500 Internal Server Error`: Server-side error.

---

## Rate Limiting

A basic rate limiting mechanism is applied globally to authenticated endpoints to prevent abuse.
-   **Header**: `X-RateLimit-Limit` (Total requests allowed in the window)
-   **Header**: `X-RateLimit-Remaining` (Requests remaining in the current window)
-   **Header**: `X-RateLimit-Reset` (Time in UTC epoch seconds when the limit resets)
-   **Response `429 Too Many Requests`**:
    ```json
    {
      "code": 429,
      "message": "Too Many Requests. Please try again after X seconds."
    }
    ```
    -   **Header**: `Retry-After` (Seconds until the client can retry)
```