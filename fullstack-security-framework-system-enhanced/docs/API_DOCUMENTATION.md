# API Documentation

This document provides a summary of the API endpoints available in the secure web application. For interactive documentation, please visit the [Swagger UI](#api-documentation) at `http://localhost:5000/api-docs` when the backend is running.

## Base URL

The base URL for all API endpoints is `http://localhost:5000/api/v1` (or your deployed backend URL).

## Authentication

All protected routes require an `accessToken` sent as an HttpOnly cookie. The system also uses a `refreshToken` (also HttpOnly cookie) for automatically renewing `accessToken`s.

### Auth Endpoints

*   **`POST /auth/register`**
    *   **Description:** Register a new user.
    *   **Request Body:** `name`, `email`, `password` (string, min 8 chars, strong password policy).
    *   **Responses:** `201 Created` (success), `400 Bad Request` (validation error), `409 Conflict` (email already exists).
    *   **Rate Limited:** Yes.

*   **`POST /auth/login`**
    *   **Description:** Authenticate user and issue tokens.
    *   **Request Body:** `email`, `password`.
    *   **Responses:** `200 OK` (success, sets `accessToken` and `refreshToken` HttpOnly cookies), `401 Unauthorized` (invalid credentials).
    *   **Rate Limited:** Yes.

*   **`POST /auth/logout`**
    *   **Description:** Log out the current user, invalidating tokens and clearing cookies.
    *   **Responses:** `200 OK` (success, clears cookies).

*   **`POST /auth/refresh-token`**
    *   **Description:** Use the `refreshToken` cookie to obtain a new `accessToken` and `refreshToken`.
    *   **Responses:** `200 OK` (success, sets new tokens), `401 Unauthorized` (invalid/missing refresh token).

*   **`POST /auth/forgot-password`**
    *   **Description:** Send a password reset link to the user's email.
    *   **Request Body:** `email`.
    *   **Responses:** `200 OK` (success, regardless of user existence to prevent enumeration).

*   **`POST /auth/reset-password`**
    *   **Description:** Reset user's password using a valid reset token.
    *   **Request Body:** `token`, `newPassword`.
    *   **Responses:** `200 OK` (success), `400 Bad Request`, `401 Unauthorized` (invalid token).

## User Endpoints

Requires `accessToken` in cookie. Authorization is role-based.

*   **`GET /users`**
    *   **Description:** Get a list of all users.
    *   **Authorization:** `admin` role required.
    *   **Query Params:** `name`, `role`, `limit`, `page`.
    *   **Responses:** `200 OK`, `401 Unauthorized`, `403 Forbidden`.
    *   **Rate Limited:** Yes.

*   **`GET /users/:userId`**
    *   **Description:** Get a single user by ID.
    *   **Authorization:** `admin` role (any user), `user` role (self).
    *   **Responses:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
    *   **Rate Limited:** Yes.

*   **`PATCH /users/:userId`**
    *   **Description:** Update a user's details.
    *   **Authorization:** `admin` role (any user), `user` role (self, limited fields).
    *   **Request Body:** `name`, `email`, `role` (admin only).
    *   **Responses:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (email taken).
    *   **Rate Limited:** Yes.

*   **`DELETE /users/:userId`**
    *   **Description:** Delete a user.
    *   **Authorization:** `admin` role required.
    *   **Responses:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
    *   **Rate Limited:** Yes.

*   **`POST /users/change-password`**
    *   **Description:** Change authenticated user's password.
    *   **Authorization:** Authenticated user.
    *   **Request Body:** `oldPassword`, `newPassword`.
    *   **Responses:** `200 OK`, `400 Bad Request`, `401 Unauthorized`.
    *   **Rate Limited:** Yes.

## Product Endpoints

Requires `accessToken` in cookie. Authorization is role-based.

*   **`POST /products`**
    *   **Description:** Create a new product.
    *   **Authorization:** `admin` role required.
    *   **Request Body:** `name`, `description`, `price`, `stock`.
    *   **Responses:** `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.
    *   **Rate Limited:** Yes.

*   **`GET /products`**
    *   **Description:** Get a list of all products.
    *   **Authorization:** Any authenticated user.
    *   **Query Params:** `name`, `minPrice`, `maxPrice`, `limit`, `page`.
    *   **Responses:** `200 OK`, `401 Unauthorized`.
    *   **Rate Limited:** Yes.

*   **`GET /products/:productId`**
    *   **Description:** Get a single product by ID.
    *   **Authorization:** Any authenticated user.
    *   **Responses:** `200 OK`, `401 Unauthorized`, `404 Not Found`.
    *   **Rate Limited:** Yes.

*   **`PATCH /products/:productId`**
    *   **Description:** Update a product's details.
    *   **Authorization:** `admin` role required.
    *   **Request Body:** `name`, `description`, `price`, `stock` (partial update).
    *   **Responses:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
    *   **Rate Limited:** Yes.

*   **`DELETE /products/:productId`**
    *   **Description:** Delete a product.
    *   **Authorization:** `admin` role required.
    *   **Responses:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.
    *   **Rate Limited:** Yes.

---
**Note:** This is a high-level overview. For precise details, including error formats and full schema definitions, please consult the live Swagger UI.