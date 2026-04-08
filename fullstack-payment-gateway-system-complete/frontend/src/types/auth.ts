// Re-using backend DTOs and entity enums for consistency

export enum UserRole {
  ADMIN = 'admin',
  MERCHANT_USER = 'merchant_user',
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  role?: UserRole;
  merchantId?: string;
}

export interface CreateUserDto extends RegisterDto {} // For Admin to create users

export interface UpdateUserDto extends Partial<RegisterDto> {
  password?: string; // Optional password update
}

export interface AuthResponse {
  access_token: string;
}

export interface UserProfile {
  email: string;
  sub: string; // user ID
  role: UserRole;
  merchantId?: string;
  iat: number;
  exp: number;
}