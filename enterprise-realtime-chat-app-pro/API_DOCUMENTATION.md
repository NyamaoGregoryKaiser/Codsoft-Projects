```markdown
# Real-time Chat Application API Documentation

This document outlines the REST API endpoints and WebSocket message protocols for the real-time chat application.

## Base URLs

*   **REST API**: `http://localhost:9001` (or your configured `HTTP_PORT`)
*   **WebSocket API**: `ws://localhost:9002` (or your configured `WEBSOCKET_PORT`)

## Authentication

All REST API endpoints (except `/auth/register` and `/auth/login`) and all WebSocket actions (except `AUTH`) require a JSON Web Token (JWT) in the `Authorization` header.

**Header Format**: `Authorization: Bearer <your_jwt_token>`

## REST API Endpoints

### 1. User Authentication

#### `POST /auth/register`

Registers a new user.

*   **Request Body**:
    ```json
    {
        "username": "string",
        "email": "string",
        "password": "string"
    }
    ```
*   **Responses**:
    *   `201 Created`: User registered successfully.
        ```json
        {
            "message": "User registered successfully",
            "token": "string (JWT)"
        }
        ```
    *   `400 Bad Request`: Invalid input (e.g., empty fields, short password).
    *   `409 Conflict`: Username or email already exists.
    *   `500 Internal Server Error`: Server error.

#### `POST /auth/login`

Authenticates a user and returns a JWT.

*   **Request Body**:
    ```json
    {
        "username": "string",
        "password": "string"
    }
    ```
*   **Responses**:
    *   `200 OK`: Login successful.
        ```json
        {
            "message": "Login successful",
            "token": "string (JWT)"
        }
        ```
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Invalid username or password.
    *   `500 Internal Server Error`: Server error.

#### `POST /auth/logout` (Authenticated)

Invalidates the current user's JWT session (clears from Redis cache).

*   **Request Body**: None
*   **Responses**:
    *   `200 OK`: Logged out successfully.
        ```json
        {
            "message": "Logged out successfully"
        }
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

### 2. Room Management

#### `GET /rooms` (Authenticated)

Retrieves a list of all available chat rooms.

*   **Responses**:
    *   `200 OK`: List of rooms.
        ```json
        [
            {
                "id": 1,
                "name": "General Chat",
                "owner_id": 101,
                "created_at": "YYYY-MM-DDTHH:MM:SSZ"
            },
            {
                "id": 2,
                "name": "Dev Discussion",
                "owner_id": 102,
                "created_at": "YYYY-MM-DDTHH:MM:SSZ"
            }
        ]
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

#### `GET /users/me/rooms` (Authenticated)

Retrieves a list of rooms the authenticated user is a member of.

*   **Responses**:
    *   `200 OK`: List of user's rooms.
        ```json
        [
            { /* Room Object */ },
            { /* ... */ }
        ]
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

#### `POST /rooms` (Authenticated)

Creates a new chat room.

*   **Request Body**:
    ```json
    {
        "name": "string"
    }
    ```
*   **Responses**:
    *   `201 Created`: Room created successfully.
        ```json
        {
            "message": "Room created successfully",
            "room": {
                "id": 3,
                "name": "My New Room",
                "owner_id": 101,
                "created_at": "YYYY-MM-DDTHH:MM:SSZ"
            }
        }
        ```
    *   `400 Bad Request`: Invalid input.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

#### `POST /rooms/:id/join` (Authenticated)

Adds the authenticated user to a specified room.

*   **Path Parameters**: `id` (long) - The ID of the room to join.
*   **Responses**:
    *   `200 OK`: Joined room successfully.
        ```json
        {
            "message": "Joined room successfully"
        }
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: Room or user not found, or user already in room.
    *   `500 Internal Server Error`: Server error.

#### `POST /rooms/:id/leave` (Authenticated)

Removes the authenticated user from a specified room.

*   **Path Parameters**: `id` (long) - The ID of the room to leave.
*   **Responses**:
    *   `200 OK`: Left room successfully.
        ```json
        {
            "message": "Left room successfully"
        }
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `404 Not Found`: User not in room or room does not exist.
    *   `500 Internal Server Error`: Server error.

#### `DELETE /rooms/:id` (Authenticated)

Deletes a chat room. Only the room owner can delete a room.

*   **Path Parameters**: `id` (long) - The ID of the room to delete.
*   **Responses**:
    *   `204 No Content`: Room deleted successfully.
    *   `401 Unauthorized`: Invalid or missing token.
    *   `403 Forbidden`: User is not the owner of the room.
    *   `404 Not Found`: Room not found.
    *   `500 Internal Server Error`: Server error.

### 3. Message Management

#### `GET /rooms/:id/messages` (Authenticated)

Retrieves message history for a specified room.

*   **Path Parameters**: `id` (long) - The ID of the room.
*   **Query Parameters**:
    *   `limit` (int, optional): Maximum number of messages to return (default: 100).
    *   `offset` (int, optional): Number of messages to skip (default: 0).
*   **Responses**:
    *   `200 OK`: List of messages.
        ```json
        [
            {
                "id": 1,
                "room_id": 1,
                "sender_id": 101,
                "content": "Hello everyone!",
                "created_at": "YYYY-MM-DDTHH:MM:SSZ"
            },
            {
                "id": 2,
                "room_id": 1,
                "sender_id": 102,
                "content": "Hey Alice!",
                "created_at": "YYYY-MM-DDTHH:MM:SSZ"
            }
        ]
        ```
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

#### `POST /rooms/:id/messages` (Authenticated)

Sends a new message to a specified room (REST fallback, real-time via WebSocket is preferred).

*   **Path Parameters**: `id` (long) - The ID of the room.
*   **Request Body**:
    ```json
    {
        "content": "string"
    }
    ```
*   **Responses**:
    *   `201 Created`: Message sent.
        ```json
        {
            "message": "Message sent",
            "message_id": 3
        }
        ```
    *   `400 Bad Request`: Invalid input (e.g., empty content).
    *   `401 Unauthorized`: Invalid or missing token.
    *   `500 Internal Server Error`: Server error.

## WebSocket Protocol

Clients connect to `ws://localhost:9002` to establish a real-time connection. All messages exchanged via WebSocket are JSON objects with a `type` field indicating the message purpose.

### Client-to-Server Messages

#### 1. `AUTH`

Authenticates the WebSocket connection using a JWT obtained from the REST API.

```json
{
    "type": "AUTH",
    "token": "string (JWT)"
}
```

#### 2. `JOIN_ROOM`

Subscribes the authenticated user to receive messages from a specific chat room.

```json
{
    "type": "JOIN_ROOM",
    "room_id": long
}
```

#### 3. `LEAVE_ROOM`

Unsubscribes the authenticated user from a specific chat room.

```json
{
    "type": "LEAVE_ROOM",
    "room_id": long
}
```

#### 4. `CHAT_MESSAGE`

Sends a new chat message to a specific room.

```json
{
    "type": "CHAT_MESSAGE",
    "room_id": long,
    "content": "string"
}
```

### Server-to-Client Messages

#### 1. `AUTH_SUCCESS`

Sent by the server upon successful authentication.

```json
{
    "type": "AUTH_SUCCESS",
    "user_id": long,
    "username": "string"
}
```

#### 2. `AUTH_FAILED`

Sent by the server if authentication fails (invalid or expired token).

```json
{
    "type": "AUTH_FAILED",
    "message": "string"
}
```

#### 3. `ROOM_JOINED`

Confirms the user has joined a room.

```json
{
    "type": "ROOM_JOINED",
    "room_id": long
}
```

#### 4. `ROOM_LEFT`

Confirms the user has left a room.

```json
{
    "type": "ROOM_LEFT",
    "room_id": long
}
```

#### 5. `NEW_CHAT_MESSAGE`

Broadcasted to all subscribed clients in a room when a new message is sent.

```json
{
    "type": "NEW_CHAT_MESSAGE",
    "message": {
        "id": long,
        "room_id": long,
        "sender_id": long,
        "sender_username": "string",
        "content": "string",
        "created_at": long (Unix timestamp in milliseconds)
    }
}
```

#### 6. `ERROR`

Generic error message from the server.

```json
{
    "type": "ERROR",
    "message": "string"
}
```
```