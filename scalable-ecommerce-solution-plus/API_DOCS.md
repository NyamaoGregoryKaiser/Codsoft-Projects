```markdown
# E-Commerce API Documentation

This document describes the RESTful API endpoints for the E-commerce Backend System.
The API follows a versioned approach (`/api/v1/...`) and uses JSON for request and response bodies.

## Base URL

`http://localhost:8080/api/v1` (during development)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token:

`Authorization: Bearer <YOUR_JWT_TOKEN>`

## Error Handling

Errors are returned with appropriate HTTP status codes and a JSON body containing an `error` message and `statusCode`.

```json
{
  "error": "Error message details",
  "statusCode": 400
}
```

## Endpoints

---

### 1. User Authentication & Profile

#### `POST /auth/register` - Register a new user

*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string (email format)",
      "password": "string (min 8 characters)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "User registered successfully",
      "token": "string (JWT token)"
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input (e.g., missing fields, weak password).
    *   `409 Conflict`: User with this email already exists.

#### `POST /auth/login` - Log in an existing user

*   **Description:** Authenticates a user and returns a JWT token.
*   **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "string (JWT token)"
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Invalid credentials.

#### `GET /users/profile` - Get authenticated user's profile

*   **Description:** Retrieves the profile information of the currently authenticated user.
*   **Authorization:** Required (User role)
*   **Response (200 OK):**
    ```json
    {
      "id": 1,
      "username": "johndoe",
      "email": "john.doe@example.com",
      "createdAt": "2023-01-01T10:00:00Z",
      "updatedAt": "2023-01-01T10:00:00Z",
      "role": "user"
    }
    ```
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: User not found (should not happen if token is valid).

#### `PUT /users/profile` - Update authenticated user's profile

*   **Description:** Updates the profile information of the currently authenticated user.
*   **Authorization:** Required (User role)
*   **Request Body:** (Partial updates allowed)
    ```json
    {
      "username": "string",
      "email": "string"
      // Password updates should be handled via a separate endpoint for security
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Profile updated successfully",
      "id": 1,
      "username": "johndoe_updated",
      "email": "john.doe.updated@example.com",
      "createdAt": "2023-01-01T10:00:00Z",
      "updatedAt": "2023-10-27T15:30:00Z",
      "role": "user"
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Missing or invalid token.

---

### 2. Product Catalog

#### `GET /products` - Get all products

*   **Description:** Retrieves a list of all products. Supports optional query parameters for filtering and pagination.
*   **Query Parameters:**
    *   `category_id`: Filter by category ID.
    *   `search`: Full-text search on product name/description.
    *   `page`: Page number (default: 1).
    *   `limit`: Items per page (default: 10).
*   **Response (200 OK):**
    ```json
    {
      "products": [
        {
          "id": 1,
          "name": "Laptop Pro X",
          "description": "Powerful laptop...",
          "price": 1200.00,
          "stockQuantity": 50,
          "categoryId": 1,
          "imageUrl": "https://example.com/laptop.jpg",
          "createdAt": "2023-01-01T10:00:00Z",
          "updatedAt": "2023-01-01T10:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

#### `GET /products/{id}` - Get product by ID

*   **Description:** Retrieves details of a specific product.
*   **Path Parameters:** `id` (integer) - The product ID.
*   **Response (200 OK):**
    ```json
    {
      "id": 1,
      "name": "Laptop Pro X",
      "description": "Powerful laptop...",
      "price": 1200.00,
      "stockQuantity": 50,
      "categoryId": 1,
      "imageUrl": "https://example.com/laptop.jpg",
      "createdAt": "2023-01-01T10:00:00Z",
      "updatedAt": "2023-01-01T10:00:00Z"
    }
    ```
*   **Errors:**
    *   `404 Not Found`: Product with the given ID does not exist.

#### `POST /products` - Create a new product

*   **Description:** Adds a new product to the catalog.
*   **Authorization:** Required (Admin role)
*   **Request Body:**
    ```json
    {
      "name": "string",
      "description": "string",
      "price": "number",
      "stockQuantity": "integer",
      "categoryId": "integer",
      "imageUrl": "string (URL)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Product created successfully",
      "product": { ... product details ... }
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: User does not have admin privileges.

#### `PUT /products/{id}` - Update an existing product

*   **Description:** Updates details of an existing product.
*   **Authorization:** Required (Admin role)
*   **Path Parameters:** `id` (integer) - The product ID.
*   **Request Body:** (Partial updates allowed)
    ```json
    {
      "name": "string (optional)",
      "price": "number (optional)",
      "stockQuantity": "integer (optional)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Product updated successfully",
      "product": { ... updated product details ... }
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: User does not have admin privileges.
    *   `404 Not Found`: Product with the given ID does not exist.

#### `DELETE /products/{id}` - Delete a product

*   **Description:** Removes a product from the catalog.
*   **Authorization:** Required (Admin role)
*   **Path Parameters:** `id` (integer) - The product ID.
*   **Response (204 No Content):** Empty response on successful deletion.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: User does not have admin privileges.
    *   `404 Not Found`: Product with the given ID does not exist.

---

### 3. Shopping Cart

#### `GET /cart` - Get user's shopping cart

*   **Description:** Retrieves the contents of the authenticated user's shopping cart.
*   **Authorization:** Required (User role)
*   **Response (200 OK):**
    ```json
    {
      "cartId": 1,
      "userId": 1,
      "items": [
        {
          "productId": 2,
          "name": "Wireless Earbuds",
          "quantity": 1,
          "price": 150.00,
          "imageUrl": "https://example.com/earbuds.jpg"
        },
        {
          "productId": 4,
          "name": "T-Shirt Basic",
          "quantity": 2,
          "price": 15.00,
          "imageUrl": "https://example.com/tshirt.jpg"
        }
      ],
      "totalItems": 3,
      "totalPrice": 180.00
    }
    ```

#### `POST /cart/items` - Add item to cart

*   **Description:** Adds a product to the authenticated user's cart or updates its quantity if already present.
*   **Authorization:** Required (User role)
*   **Request Body:**
    ```json
    {
      "productId": "integer",
      "quantity": "integer (>= 1)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Item added/updated in cart successfully",
      "cartItem": {
        "productId": 2,
        "quantity": 1
      }
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input, product out of stock.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: Product not found.

#### `PUT /cart/items/{productId}` - Update item quantity in cart

*   **Description:** Updates the quantity of a specific product in the user's cart.
*   **Authorization:** Required (User role)
*   **Path Parameters:** `productId` (integer) - The product ID in the cart.
*   **Request Body:**
    ```json
    {
      "quantity": "integer (>= 1)"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Cart item quantity updated",
      "cartItem": {
        "productId": 2,
        "quantity": 3
      }
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid quantity, not enough stock.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: Product not found in cart.

#### `DELETE /cart/items/{productId}` - Remove item from cart

*   **Description:** Removes a product entirely from the authenticated user's cart.
*   **Authorization:** Required (User role)
*   **Path Parameters:** `productId` (integer) - The product ID in the cart.
*   **Response (204 No Content):** Empty response on successful deletion.
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `404 Not Found`: Product not found in cart.

---

### 4. Order Management

#### `POST /orders` - Create a new order

*   **Description:** Creates a new order from the authenticated user's current shopping cart. Clears the cart upon successful order creation.
*   **Authorization:** Required (User role)
*   **Request Body:**
    ```json
    {
      "shippingAddress": "string (full address)",
      "paymentMethod": "string (e.g., 'Credit Card', 'PayPal')",
      "paymentToken": "string (e.g., a token from a payment gateway, NOT raw card details)"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "Order placed successfully",
      "orderId": 101,
      "totalAmount": 180.00
    }
    ```
*   **Errors:**
    *   `400 Bad Request`: Invalid input, empty cart, payment processing failed, out of stock items.
    *   `401 Unauthorized`: Missing or invalid token.
    *   `500 Internal Server Error`: Server processing error.

#### `GET /orders` - Get all orders for the authenticated user

*   **Description:** Retrieves a list of all orders placed by the authenticated user.
*   **Authorization:** Required (User role)
*   **Response (200 OK):**
    ```json
    {
      "orders": [
        {
          "id": 101,
          "userId": 1,
          "orderDate": "2023-10-27T16:00:00Z",
          "totalAmount": 180.00,
          "status": "pending",
          "shippingAddress": "123 Main St, Anytown, USA",
          "paymentStatus": "paid",
          "items": [
            {
              "productId": 2,
              "name": "Wireless Earbuds",
              "quantity": 1,
              "priceAtPurchase": 150.00
            },
            {
              "productId": 4,
              "name": "T-Shirt Basic",
              "quantity": 2,
              "priceAtPurchase": 15.00
            }
          ]
        }
      ]
    }
    ```

#### `GET /orders/{id}` - Get a specific order by ID

*   **Description:** Retrieves details of a specific order for the authenticated user.
*   **Authorization:** Required (User role)
*   **Path Parameters:** `id` (integer) - The order ID.
*   **Response (200 OK):** (Similar to `GET /orders` item, but for single order)
*   **Errors:**
    *   `401 Unauthorized`: Missing or invalid token.
    *   `403 Forbidden`: User is not authorized to view this order.
    *   `404 Not Found`: Order with the given ID does not exist for this user.

---
```