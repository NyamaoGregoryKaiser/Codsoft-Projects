# Real-time Chat Application - API Documentation

This document describes the HTTP (REST) and WebSocket APIs for the Real-time Chat Application.
For a live, interactive API documentation, visit `/api/docs` on the backend server (e.g., `http://localhost:3000/api/docs`).

---

## 1. Authentication (HTTP/REST)

**Base URL**: `/auth`

All successful responses will typically have `200 OK` or `201 Created`. Error responses will vary (e.g., `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`) with a JSON body:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error Name",
  "timestamp": "ISO_DATE_STRING",
  "path": "/api/v1/resource"
}
```

### 1.1. Register User

`POST /auth/register`

Registers a new user account.

**Request Body:**
```json
{
  "username": "string",  // Min 3, Max 50 characters
  "email": "string",     // Valid email format
  "password": "string"   // Min 6 characters
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "createdAt": "ISO_DATE_STRING",
  "updatedAt": "ISO_DATE_STRING"
}
```

**Possible Errors:**
*   `400 Bad Request`: Invalid input (e.g., password too short, invalid email).
*   `400 Bad Request`: Username or email already exists.

### 1.2. Login User

`POST /auth/login`

Authenticates a user and issues a JSON Web Token (JWT).

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (201 Created):**
```json
{
  "access_token": "string" // The JWT token to be used for authentication
}
```

**Possible Errors:**
*   `401 Unauthorized`: Invalid credentials (username or password).

### 1.3. Get User Profile

`GET /auth/profile`

Retrieves the profile information of the currently authenticated user. Requires a valid JWT.

**Headers:**
*   `Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "createdAt": "ISO_DATE_STRING",
  "updatedAt": "ISO_DATE_STRING"
}
```

**Possible Errors:**
*   `401 Unauthorized`: Missing or invalid JWT.

---

## 2. User Management (HTTP/REST)

**Base URL**: `/users`

All endpoints under `/users` require a valid JWT via the `Authorization: Bearer <access_token>` header.

### 2.1. Get All Users

`GET /users`

Retrieves a list of all registered users.

**Headers:**
*   `Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "createdAt": "ISO_DATE_STRING",
    "updatedAt": "ISO_DATE_STRING"
  },
  // ... more users
]
```

**Possible Errors:**
*   `401 Unauthorized`: Missing or invalid JWT.

### 2.2. Get User by ID

`GET /users/:id`

Retrieves a single user by their ID.

**Headers:**
*   `Authorization: Bearer <access_token>`

**Path Parameters:**
*   `id`: `uuid` - The ID of the user.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "createdAt": "ISO_DATE_STRING",
  "updatedAt": "ISO_DATE_STRING"
}
```

**Possible Errors:**
*   `401 Unauthorized`: Missing or invalid JWT.
*   `404 Not Found`: User with the given ID does not exist.

### 2.3. Update User

`PATCH /users/:id`

Updates an existing user's information.

**Headers:**
*   `Authorization: Bearer <access_token>`

**Path Parameters:**
*   `id`: `uuid` - The ID of the user to update.

**Request Body (Partial update allowed):**
```json
{
  "username"?: "string",
  "email"?: "string",
  "avatar"?: "string"
  // Password changes should ideally be a separate, more secure endpoint
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "createdAt": "ISO_DATE_STRING",
  "updatedAt": "ISO_DATE_STRING"
}
```

**Possible Errors:**
*   `401 Unauthorized`: Missing or invalid JWT.
*   `404 Not Found`: User with the given ID does not exist.
*   `400 Bad Request`: Invalid input (e.g., duplicate username/email, invalid format).

### 2.4. Delete User

`DELETE /users/:id`

Deletes a user account.

**Headers:**
*   `Authorization: Bearer <access_token>`

**Path Parameters:**
*   `id`: `uuid` - The ID of the user to delete.

**Response (200 OK):**
```json
{
  "message": "User successfully removed."
}
```

**Possible Errors:**
*   `401 Unauthorized`: Missing or invalid JWT.
*   `404 Not Found`: User with the given ID does not exist.

---

## 3. Chat (WebSocket/Socket.IO)

**Namespace**: `/chat`
**Endpoint**: `ws://localhost:3000/chat` (adjust host/port as per environment)

All WebSocket events require authentication. The JWT token must be passed during the connection handshake.

**Authentication for WebSocket:**
When connecting with `socket.io-client`, pass the JWT in the `auth` object, `query` parameter, or `extraHeaders`:

```typescript
// Example socket.io-client connection
import { io } from 'socket.io-client';
const accessToken = localStorage.getItem('accessToken'); // Or from cookies

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: accessToken
  },
  query: { // Also for robustness, can be used by WsJwtAuthGuard
    token: accessToken
  },
  extraHeaders: { // Another option
    Authorization: `Bearer ${accessToken}`
  }
});
```

### 3.1. Events Sent by Client (Emit)

#### `sendMessage`
Sends a new message to a specific room.
*   **Data**: `{ roomId: string, content: string, type?: 'text' | 'image' | 'file' | 'system' }`
*   **Acknowledgement (Callback)**:
    *   `{ event: 'messageSent', data: { success: true, messageId: string } }` on success.
    *   `{ event: 'exception', data: { message: string, ... } }` on error (e.g., user not in room).

#### `createRoom`
Creates a new chat room.
*   **Data**: `{ name: string, type: 'public' | 'private' | 'direct' }`
*   **Acknowledgement (Callback)**:
    *   `{ event: 'roomCreated', data: { success: true, roomId: string } }` on success.
    *   `{ event: 'exception', data: { message: string, ... } }` on error.

#### `joinRoom`
Adds the authenticated user as a member to a specified room.
*   **Data**: `{ roomId: string }`
*   **Acknowledgement (Callback)**:
    *   `{ event: 'roomJoined', data: { success: true, roomId: string } }` on success.
    *   `{ event: 'exception', data: { message: string, ... } }` on error (e.g., already a member, room not found).

#### `leaveRoom`
Removes the authenticated user from a specified room.
*   **Data**: `{ roomId: string }`
*   **Acknowledgement (Callback)**:
    *   `{ event: 'roomLeft', data: { success: true, roomId: string } }` on success.
    *   `{ event: 'exception', data: { message: string, ... } }` on error (e.g., not a member, room not found).

#### `getRoomMessages`
Retrieves paginated message history for a room.
*   **Data**: `{ roomId: string, limit?: number, offset?: number }` (default limit 50, offset 0)
*   **Acknowledgement (Callback)**:
    *   `{ event: 'roomMessages', data: { roomId: string, messages: Message[] } }` on success.
    *   `{ event: 'exception', data: { message: string, ... } }` on error (e.g., user not authorized).

#### `typing`
Indicates that the user is typing in a room.
*   **Data**: `{ roomId: string }`
*   **No Acknowledgement**.

### 3.2. Events Received by Client (On)

#### `connect`
Emitted upon successful WebSocket connection.
*   **Data**: None.

#### `disconnect`
Emitted when the WebSocket connection is closed.
*   **Data**: `string` (reason for disconnection).

#### `connect_error`
Emitted when the WebSocket connection fails or is rejected.
*   **Data**: `Error` object.

#### `exception`
Global error handler for WebSocket events.
*   **Data**: `{ statusCode: number, message: string, error: string, timestamp: string }`

#### `userStatus`
Notifies about a user's online/offline status change.
*   **Data**: `{ userId: string, status: 'online' | 'offline' }`

#### `newMessage`
Emitted when a new message is sent to a room the client is a member of.
*   **Data**: `Message` object (contains `id`, `content`, `timestamp`, `sender`, `roomId`, `type`).

#### `roomCreated`
Notifies the creator when a new room is successfully created.
*   **Data**: `Room` object (contains `id`, `name`, `type`, `creator`, `createdAt`, `updatedAt`).

#### `userJoinedRoom`
Notifies all members of a room when a new user joins.
*   **Data**: `{ roomId: string, userId: string, username: string }`

#### `userLeftRoom`
Notifies all members of a room when a user leaves.
*   **Data**: `{ roomId: string, userId: string, username: string }`

#### `typing`
Indicates that another user is typing in the current room.
*   **Data**: `{ roomId: string, userId: string, username: string }`

---
This documentation outlines the primary endpoints and events. For detailed request/response schemas, refer to the backend's Swagger documentation.