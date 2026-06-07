```typescript
// src/types/index.ts

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface MessageSender {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string;
  sender: MessageSender;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  members: User[]; // Full User objects
  messages: Message[]; // List of messages
}

export interface ChatRoomCreate {
  name: string;
}

export interface WsMessagePayload {
  content: string;
}

// WebSocket message data structure for receiving
export interface WebSocketMessageEvent {
  data: string; // JSON string of Message
}

```