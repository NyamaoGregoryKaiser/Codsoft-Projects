import { UserRole } from "./user.entity";

// DTO for creating a new user (admin only)
export interface CreateUserDto {
  username: string;
  email: string;
  password?: string; // Optional if admin is creating a placeholder
  role: UserRole;
}

// DTO for updating an existing user
export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

// DTO for user response (excluding sensitive info like password)
export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}