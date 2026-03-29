```typescript
import apiClient from './index';
import { Product, PaginatedResult } from '../types';

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

export const productApi = {
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResult<{ products: Product[] }>> => {
    const response = await apiClient.get('/products', { params: filters });
    return {
      results: response.data.results,
      pagination: response.data.pagination,
      data: { products: response.data.data.products }
    };
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data.product;
  },

  // Admin-only functions (assuming auth is handled by backend)
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/products', productData);
    return response.data.data.product;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}`, productData);
    return response.data.data.product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
```