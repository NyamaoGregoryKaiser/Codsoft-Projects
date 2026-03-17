export enum UserRole {
    ADMIN = "ADMIN",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export enum ContentStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}

export interface Content {
    id: string;
    title: string;
    body: string;
    thumbnailUrl?: string;
    status: ContentStatus;
    isFeatured: boolean;
    author: Pick<User, 'id' | 'email' | 'role'>;
    category: Pick<Category, 'id' | 'name'>;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    meta?: PaginationMeta;
}