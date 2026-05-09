import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

// Extend the Express Request type to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export { UserRole };

// Generic API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  pages?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<{ data: T[]; meta: PaginationMeta }> {}

// Redis Cache Configuration
export interface RedisCacheConfig {
  key: string;
  ttl?: number; // Time to live in seconds
}