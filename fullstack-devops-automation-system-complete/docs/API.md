# API Documentation: Product Catalog Management System

This document provides a comprehensive overview of the RESTful API endpoints for the Product Catalog Management System. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api` (or `http://localhost/api` when using Nginx)

## Authentication

All protected routes require a JSON Web Token (JWT) to be passed in the `Authorization` header as a Bearer token: `Authorization: Bearer <your_token>`.

### 1. User Authentication

#### 1.1. Register User

*   **URL:** `/api/auth/register`
*   **Method:** `POST`
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
        "username": "john.doe",
        "email": "john.doe@example.com",
        "password": "StrongPassword123!",
        "role": "USER" // Optional, defaults to "USER". Can be "ADMIN" or "USER".
                        // Only an existing ADMIN can create new ADMIN users.
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
        "message": "User registered successfully",
        "user": {
            "id": "uuid-of-user",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "USER",
            "createdAt": "2023-10-27T10:00:00.000Z"
        }
    }
    ```
*   **Error Responses (400 Bad Request):**
    *   `{ "message": "Email already registered" }`
    *   `{ "message": "Username already taken" }`
    *   `{ "message": "Invalid password. Must be at least 8 characters, include uppercase, lowercase, number, and special character." }`
    *   `{ "message": "Invalid role specified" }`
    *   `{ "message": "Unauthorized: Only ADMIN can create ADMIN users" }` (if trying to register as ADMIN without admin token)

#### 1.2. Login User

*   **URL:** `/api/auth/login`
*   **Method:** `POST`
*   **Description:** Authenticates a user and returns a JWT token.
*   **Request Body:**
    ```json
    {
        "email": "john.doe@example.com",
        "password": "StrongPassword123!"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "message": "Logged in successfully",
        "token": "your.json.web.token",
        "user": {
            "id": "uuid-of-user",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "USER"
        }
    }
    ```
*   **Error Responses (401 Unauthorized):**
    *   `{ "message": "Invalid credentials" }`

### 2. User Management (Protected - Admin Only)

These endpoints require an `ADMIN` role.

#### 2.1. Get All Users

*   **URL:** `/api/users`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all registered users.
*   **Success Response (200 OK):**
    ```json
    [
        {
            "id": "uuid-of-user-1",
            "username": "admin_user",
            "email": "admin@example.com",
            "role": "ADMIN",
            "createdAt": "2023-10-27T10:00:00.000Z"
        },
        {
            "id": "uuid-of-user-2",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "USER",
            "createdAt": "2023-10-27T10:05:00.000Z"
        }
    ]
    ```
*   **Error Responses (401 Unauthorized, 403 Forbidden):**
    *   `{ "message": "Unauthorized" }` (No token or invalid token)
    *   `{ "message": "Forbidden: Admin access required" }` (Token is valid but user is not ADMIN)

#### 2.2. Get User by ID

*   **URL:** `/api/users/:id`
*   **Method:** `GET`
*   **Description:** Retrieves a specific user by ID.
*   **Success Response (200 OK):**
    ```json
    {
        "id": "uuid-of-user",
        "username": "john.doe",
        "email": "john.doe@example.com",
        "role": "USER",
        "createdAt": "2023-10-27T10:05:00.000Z"
    }
    ```
*   **Error Responses (401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "User not found" }`

#### 2.3. Update User Role

*   **URL:** `/api/users/:id/role`
*   **Method:** `PATCH`
*   **Description:** Updates the role of a specific user.
*   **Request Body:**
    ```json
    {
        "role": "ADMIN" // Can be "ADMIN" or "USER"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "message": "User role updated successfully",
        "user": {
            "id": "uuid-of-user",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "ADMIN",
            "createdAt": "2023-10-27T10:05:00.000Z"
        }
    }
    ```
*   **Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Invalid role specified" }`
    *   `{ "message": "Cannot change your own role" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "User not found" }`

#### 2.4. Delete User

*   **URL:** `/api/users/:id`
*   **Method:** `DELETE`
*   **Description:** Deletes a specific user.
*   **Success Response (204 No Content):** (No body content)
*   **Error Responses (401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Cannot delete yourself" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "User not found" }`

### 3. Product Management (Protected - Admin Only for CRUD, All Users for Read)

#### 3.1. Get All Products

*   **URL:** `/api/products`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all products. Supports optional query parameters for filtering and pagination.
*   **Query Parameters:**
    *   `category?: string`: Filter products by category name.
    *   `search?: string`: Search products by name or description (case-insensitive).
    *   `limit?: number`: Number of products to return per page (default: 10).
    *   `offset?: number`: Number of products to skip (default: 0).
*   **Success Response (200 OK):**
    ```json
    {
        "total": 2,
        "limit": 10,
        "offset": 0,
        "products": [
            {
                "id": "uuid-of-product-1",
                "name": "Laptop Pro",
                "description": "Powerful laptop for professionals.",
                "price": 1200.00,
                "stock": 50,
                "category": {
                    "id": "uuid-of-category-1",
                    "name": "Electronics"
                },
                "createdAt": "2023-10-27T10:10:00.000Z",
                "updatedAt": "2023-10-27T10:10:00.000Z"
            },
            {
                "id": "uuid-of-product-2",
                "name": "Mechanical Keyboard",
                "description": "Tactile and responsive typing experience.",
                "price": 100.00,
                "stock": 200,
                "category": {
                    "id": "uuid-of-category-1",
                    "name": "Electronics"
                },
                "createdAt": "2023-10-27T10:11:00.000Z",
                "updatedAt": "2023-10-27T10:11:00.000Z"
            }
        ]
    }
    ```
*   **Error Responses (401 Unauthorized):**
    *   `{ "message": "Unauthorized" }` (If no token is provided, or invalid)

#### 3.2. Get Product by ID

*   **URL:** `/api/products/:id`
*   **Method:** `GET`
*   **Description:** Retrieves a specific product by ID.
*   **Success Response (200 OK):**
    ```json
    {
        "id": "uuid-of-product-1",
        "name": "Laptop Pro",
        "description": "Powerful laptop for professionals.",
        "price": 1200.00,
        "stock": 50,
        "category": {
            "id": "uuid-of-category-1",
            "name": "Electronics"
        },
        "createdAt": "2023-10-27T10:10:00.000Z",
        "updatedAt": "2023-10-27T10:10:00.000Z"
    }
    ```
*   **Error Responses (401 Unauthorized, 404 Not Found):**
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Product not found" }`

#### 3.3. Create Product (Admin Only)

*   **URL:** `/api/products`
*   **Method:** `POST`
*   **Description:** Creates a new product.
*   **Request Body:**
    ```json
    {
        "name": "New Smartphone",
        "description": "The latest smartphone with advanced features.",
        "price": 999.99,
        "stock": 150,
        "categoryId": "uuid-of-category-1"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
        "id": "uuid-of-new-product",
        "name": "New Smartphone",
        "description": "The latest smartphone with advanced features.",
        "price": 999.99,
        "stock": 150,
        "category": {
            "id": "uuid-of-category-1",
            "name": "Electronics"
        },
        "createdAt": "2023-10-27T10:15:00.000Z",
        "updatedAt": "2023-10-27T10:15:00.000Z"
    }
    ```
*   **Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Name is required" }`
    *   `{ "message": "Product with this name already exists" }`
    *   `{ "message": "Category not found" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`

#### 3.4. Update Product (Admin Only)

*   **URL:** `/api/products/:id`
*   **Method:** `PUT`
*   **Description:** Updates an existing product.
*   **Request Body:**
    ```json
    {
        "name": "Updated Laptop Pro Max",
        "description": "Even more powerful laptop for demanding professionals.",
        "price": 1499.99,
        "stock": 45,
        "categoryId": "uuid-of-category-1"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "id": "uuid-of-product",
        "name": "Updated Laptop Pro Max",
        "description": "Even more powerful laptop for demanding professionals.",
        "price": 1499.99,
        "stock": 45,
        "category": {
            "id": "uuid-of-category-1",
            "name": "Electronics"
        },
        "createdAt": "2023-10-27T10:10:00.000Z",
        "updatedAt": "2023-10-27T10:20:00.000Z"
    }
    ```
*   **Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Name is required" }`
    *   `{ "message": "Product with this name already exists" }`
    *   `{ "message": "Category not found" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "Product not found" }`

#### 3.5. Delete Product (Admin Only)

*   **URL:** `/api/products/:id`
*   **Method:** `DELETE`
*   **Description:** Deletes a specific product.
*   **Success Response (204 No Content):** (No body content)
*   **Error Responses (401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "Product not found" }`

### 4. Category Management (Protected - Admin Only for CRUD, All Users for Read)

#### 4.1. Get All Categories

*   **URL:** `/api/categories`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all product categories.
*   **Success Response (200 OK):**
    ```json
    [
        {
            "id": "uuid-of-category-1",
            "name": "Electronics",
            "createdAt": "2023-10-27T10:08:00.000Z",
            "updatedAt": "2023-10-27T10:08:00.000Z"
        },
        {
            "id": "uuid-of-category-2",
            "name": "Books",
            "createdAt": "2023-10-27T10:09:00.000Z",
            "updatedAt": "2023-10-27T10:09:00.000Z"
        }
    ]
    ```
*   **Error Responses (401 Unauthorized):**
    *   `{ "message": "Unauthorized" }`

#### 4.2. Get Category by ID

*   **URL:** `/api/categories/:id`
*   **Method:** `GET`
*   **Description:** Retrieves a specific category by ID.
*   **Success Response (200 OK):**
    ```json
    {
        "id": "uuid-of-category-1",
        "name": "Electronics",
        "createdAt": "2023-10-27T10:08:00.000Z",
        "updatedAt": "2023-10-27T10:08:00.000Z"
    }
    ```
*   **Error Responses (401 Unauthorized, 404 Not Found):**
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Category not found" }`

#### 4.3. Create Category (Admin Only)

*   **URL:** `/api/categories`
*   **Method:** `POST`
*   **Description:** Creates a new product category.
*   **Request Body:**
    ```json
    {
        "name": "Home Appliances"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
        "id": "uuid-of-new-category",
        "name": "Home Appliances",
        "createdAt": "2023-10-27T10:25:00.000Z",
        "updatedAt": "2023-10-27T10:25:00.000Z"
    }
    ```
*   **Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden):**
    *   `{ "message": "Name is required" }`
    *   `{ "message": "Category with this name already exists" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`

#### 4.4. Update Category (Admin Only)

*   **URL:** `/api/categories/:id`
*   **Method:** `PUT`
*   **Description:** Updates an existing category.
*   **Request Body:**
    ```json
    {
        "name": "Smart Gadgets"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
        "id": "uuid-of-category",
        "name": "Smart Gadgets",
        "createdAt": "2023-10-27T10:08:00.000Z",
        "updatedAt": "2023-10-27T10:30:00.000Z"
    }
    ```
*   **Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found):**
    *   `{ "message": "Name is required" }`
    *   `{ "message": "Category with this name already exists" }`
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "Category not found" }`

#### 4.5. Delete Category (Admin Only)

*   **URL:** `/api/categories/:id`
*   **Method:** `DELETE`
*   **Description:** Deletes a specific category. Note: Products associated with this category might need to be re-assigned or deleted, depending on business logic and database constraints. This implementation uses `SET NULL` for `categoryId` on product.
*   **Success Response (204 No Content):** (No body content)
*   **Error Responses (401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict):**
    *   `{ "message": "Unauthorized" }`
    *   `{ "message": "Forbidden: Admin access required" }`
    *   `{ "message": "Category not found" }`
    *   `{ "message": "Cannot delete category while it has associated products. Please reassign or delete products first." }` (If `SET NULL` is not used or specific business logic prevents deletion)

---
### 4. `docs/DEPLOYMENT.md`