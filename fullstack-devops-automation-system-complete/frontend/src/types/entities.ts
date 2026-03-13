```typescript
import { UserRole } from './enums';

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  role: UserRole;
  // password is not included in frontend User type for security
}

export interface Category extends BaseEntity {
  name: string;
  // products?: Product[]; // Optional, if needed to show products in category details
}

export interface Product extends BaseEntity {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: Category | null;
  categoryId: string | null; // For backend API requests
}

// Response structure for product list with pagination
export interface ProductResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}
```