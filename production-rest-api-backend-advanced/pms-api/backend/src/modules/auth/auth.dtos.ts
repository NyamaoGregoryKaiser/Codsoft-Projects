import { UserRole } from "../users/user.entity";

// DTO for user registration
export interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
  role?: UserRole; // Optional, typically defaults to 'member' unless explicitly set by admin
}

// DTO for user login
export interface LoginUserDto {
  email: string;
  password: string;
}

// DTO for successful authentication response
export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}