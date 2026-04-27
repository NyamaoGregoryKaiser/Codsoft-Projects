// Shared types for frontend and backend DTOs/Entities
// In a real monorepo, these would be in a shared library.

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  // password?: string; // Should never be exposed to frontend
}

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DIRECT = 'direct',
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  creator: User; // Simplified, might just be creatorId on frontend
  creatorId: string;
  members?: RoomMember[]; // Only when explicitly loaded
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  id: string; // If RoomMember has its own ID
  room: Room;
  user: User;
  joinedAt: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  sender: Omit<User, 'email' | 'createdAt' | 'updatedAt'>; // Minimal sender info
  senderId?: string; // Backend might send this separately
  roomId: string;
  content: string;
  type: MessageType;
  timestamp: string;
}

// --- DTOs ---
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface CreateRoomDto {
  name: string;
  type: RoomType;
}

export interface JoinRoomDto {
  roomId: string;
}

export interface LeaveRoomDto {
  roomId: string;
}

export interface CreateMessageDto {
  roomId: string;
  content: string;
  type?: MessageType;
}


// --- Auth Context Type ---
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}