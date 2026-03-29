```typescript
// Shared Types for Frontend (Mirroring Backend Prisma models, but simplified for UI needs)

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status: ProductStatus;
  categoryId: string;
  category?: Category; // Nested category when included
  reviews?: Review[]; // Nested reviews when included
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product; // Full product details
  quantity: number;
  price: number; // Price at the time of adding to cart
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product; // Full product details
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: User; // Nested user details
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination and API Response
export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  results?: number; // For list responses
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: T; // T could be { product: Product }, { products: Product[] }, { user: User } etc.
}

export interface ErrorResponse {
  status: 'fail' | 'error';
  message: string;
  error?: any;
}

export interface PaginatedResult<T> {
  results: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: {
    [key: string]: T[]; // e.g., { products: Product[] }
  };
}
```