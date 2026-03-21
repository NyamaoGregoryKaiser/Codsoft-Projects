# E-commerce API Documentation (v1)

This document describes the RESTful API endpoints for the E-commerce system. The API is designed to be fully CRUD-capable, authenticated, and provides various functionalities for managing users, products, categories, carts, and orders.

**Base URL**: `http://localhost:5000/api/v1` (adjust for production deployments)

## Authentication

All protected endpoints require a JSON Web Token (JWT) in the `Authorization` header.

**Header**: `Authorization: Bearer <access_token>`

### 1. Auth Module

#### `POST /auth/register`
*   **Description**: Registers a new user with a 'user' role.
*   **Request Body**:
    ```json
    {
      "name": "string",
      "email": "string (email format)",
      "password": "string (min 8 chars)"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "userId": "number",
        "tokens": {
          "access": {
            "token": "string (JWT)",
            "expires": "Date"
          },
          "refresh": {
            "token": "string (JWT)",
            "expires": "Date"
          }
        }
      }
    }
    ```
*   **Error Responses (400 Bad Request)**: `{"status": "fail", "message": "Email already taken."}` or validation errors.

#### `POST /auth/login`
*   **Description**: Logs in an existing user and returns JWT access and refresh tokens.
*   **Request Body**:
    ```json
    {
      "email": "string (email format)",
      "password": "string"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "number",
          "name": "string",
          "email": "string",
          "role": "string ('user' or 'admin')"
        },
        "tokens": {
          "access": {
            "token": "string (JWT)",
            "expires": "Date"
          },
          "refresh": {
            "token": "string (JWT)",
            "expires": "Date"
          }
        }
      }
    }
    ```
*   **Error Responses (401 Unauthorized)**: `{"status": "fail", "message": "Incorrect email or password."}`

#### `POST /auth/refresh-tokens`
*   **Description**: Generates new access and refresh tokens using an existing refresh token.
*   **Request Body**:
    ```json
    {
      "refreshToken": "string (JWT)"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "tokens": {
          "access": {
            "token": "string (new JWT)",
            "expires": "Date"
          },
          "refresh": {
            "token": "string (new JWT)",
            "expires": "Date"
          }
        }
      }
    }
    ```
*   **Error Responses (401 Unauthorized)**: `{"status": "fail", "message": "Please authenticate"}` or `Invalid refresh token`.

### 2. User Module (Protected - requires authentication)

#### `GET /users/me`
*   **Description**: Retrieves the profile of the authenticated user.
*   **Authorization**: Requires `access_token`.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "number",
        "name": "string",
        "email": "string",
        "role": "string"
      }
    }
    ```

#### `GET /users/admin-data`
*   **Description**: Example endpoint requiring 'admin' role.
*   **Authorization**: Requires `access_token` and `admin` role.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Welcome, Admin User! This is confidential admin data.",
      "data": {
        "adminId": "number",
        "adminEmail": "string"
      }
    }
    ```
*   **Error Responses (403 Forbidden)**: `{"message": "Forbidden: You do not have permission to perform this action."}`

### 3. Product Module

#### `POST /products`
*   **Description**: Creates a new product.
*   **Authorization**: Requires `access_token` with `admin` role.
*   **Request Body**:
    ```json
    {
      "name": "string",
      "description": "string",
      "price": "number (decimal)",
      "stock": "number (integer)",
      "categoryId": "number (integer, optional, foreign key)",
      "imageUrl": "string (URL, optional)"
    }
    ```
*   **Response (201 Created)**: Returns the created product object.
*   **Error Responses (400 Bad Request)**: Validation errors. (403 Forbidden) if not admin.

#### `GET /products`
*   **Description**: Retrieves a list of products with optional filtering, sorting, and pagination.
*   **Query Parameters**:
    *   `name`: `string` (case-insensitive partial match)
    *   `categoryId`: `number` (filter by category)
    *   `minPrice`: `number` (minimum price)
    *   `maxPrice`: `number` (maximum price)
    *   `sortBy`: `string` (`name`, `price`, `createdAt`, default: `createdAt`)
    *   `order`: `string` (`asc` or `desc`, default: `desc`)
    *   `limit`: `number` (items per page, default: 10)
    *   `page`: `number` (page number, default: 1)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "products": [
          {
            "id": "number",
            "name": "string",
            "description": "string",
            "price": "string (decimal)",
            "stock": "number",
            "categoryId": "number",
            "category_name": "string",
            "imageUrl": "string",
            "createdAt": "Date",
            "updatedAt": "Date"
          }
        ],
        "page": "number",
        "limit": "number",
        "totalPages": "number",
        "totalResults": "number"
      }
    }
    ```

#### `GET /products/:productId`
*   **Description**: Retrieves details of a specific product.
*   **Path Parameters**: `productId` (number)
*   **Response (200 OK)**: Returns the product object.
*   **Error Responses (404 Not Found)**: `{"status": "fail", "message": "Product not found"}`

#### `PUT /products/:productId`
*   **Description**: Updates an existing product.
*   **Authorization**: Requires `access_token` with `admin` role.
*   **Path Parameters**: `productId` (number)
*   **Request Body**: (Partial update, any field from `POST /products` body)
*   **Response (200 OK)**: Returns the updated product object.
*   **Error Responses (404 Not Found)**, (400 Bad Request) (403 Forbidden)

#### `DELETE /products/:productId`
*   **Description**: Deletes a product.
*   **Authorization**: Requires `access_token` with `admin` role.
*   **Path Parameters**: `productId` (number)
*   **Response (204 No Content)**: Successful deletion.
*   **Error Responses (404 Not Found)**, (403 Forbidden)

### 4. Cart Module (Conceptual - Backend logic mostly placeholder)

#### `GET /cart`
*   **Description**: Retrieves the authenticated user's shopping cart.
*   **Authorization**: Requires `access_token`.
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "userId": "number",
        "items": [
          // { productId, quantity, ...productDetails }
        ]
      },
      "message": "Cart fetched (mocked)"
    }
    ```

#### `POST /cart/items`
*   **Description**: Adds a product to the authenticated user's cart.
*   **Authorization**: Requires `access_token`.
*   **Request Body**:
    ```json
    {
      "productId": "number",
      "quantity": "number (integer, min 1)"
    }
    ```
*   **Response (200 OK)**: `{"status": "success", "message": "Item added to cart (mocked)"}`

#### `PUT /cart/items/:productId`
*   **Description**: Updates the quantity of a specific item in the user's cart.
*   **Authorization**: Requires `access_token`.
*   **Path Parameters**: `productId` (number)
*   **Request Body**:
    ```json
    {
      "quantity": "number (integer, min 1)"
    }
    ```
*   **Response (200 OK)**: `{"status": "success", "message": "Cart item updated (mocked)"}`

#### `DELETE /cart/items/:productId`
*   **Description**: Removes a specific item from the user's cart.
*   **Authorization**: Requires `access_token`.
*   **Path Parameters**: `productId` (number)
*   **Response (200 OK)**: `{"status": "success", "message": "Item removed from cart (mocked)"}`

### 5. Order Module (Conceptual - Backend logic mostly placeholder)

#### `POST /orders`
*   **Description**: Creates a new order from the authenticated user's cart.
*   **Authorization**: Requires `access_token`.
*   **Request Body**:
    ```json
    {
      "shippingAddress": "string",
      "paymentInfo": "object" // e.g., { cardType: "Visa", last4: "1234" }
    }
    ```
*   **Response (201 Created)**: `{"status": "success", "message": "Order created (mocked)", "data": { "orderId": "number", "userId": "number" }}`

#### `GET /orders`
*   **Description**: Retrieves all orders for the authenticated user.
*   **Authorization**: Requires `access_token`.
*   **Response (200 OK)**: `{"status": "success", "data": [...], "message": "Orders fetched (mocked)"}`

#### `GET /orders/:orderId`
*   **Description**: Retrieves details of a specific order for the authenticated user.
*   **Authorization**: Requires `access_token`. User must own the order or be an admin.
*   **Path Parameters**: `orderId` (number)
*   **Response (200 OK)**: `{"status": "success", "data": {...}, "message": "Order N fetched (mocked)"}`

#### `GET /orders/admin/all`
*   **Description**: Retrieves all orders in the system.
*   **Authorization**: Requires `access_token` with `admin` role.
*   **Response (200 OK)**: `{"status": "success", "data": [...], "message": "All orders fetched (mocked)"}`

#### `PUT /orders/:orderId/status`
*   **Description**: Updates the status of an order.
*   **Authorization**: Requires `access_token` with `admin` role.
*   **Path Parameters**: `orderId` (number)
*   **Request Body**:
    ```json
    {
      "status": "string ('pending', 'processing', 'shipped', 'delivered', 'cancelled')"
    }
    ```
*   **Response (200 OK)**: `{"status": "success", "message": "Order N status updated to X (mocked)"}`