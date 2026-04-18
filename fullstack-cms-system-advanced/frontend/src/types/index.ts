export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface Content {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: ContentStatus;
  publishedAt?: string;
  author: User;
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
}

// DTOs (simplified for frontend interaction)
export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateContentDto {
  title: string;
  slug?: string;
  body: string;
  status?: ContentStatus;
  categoryId?: string | null;
  tagIds?: string[];
}

export interface UpdateContentDto extends Partial<CreateContentDto> {}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CreateTagDto {
  name: string;
  slug?: string;
}

export interface UpdateTagDto extends Partial<CreateTagDto> {}