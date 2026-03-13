```typescript
import api from './axios';
import { Product, ProductResponse } from '@types-frontend/entities';

interface ProductQueryParams {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getProducts = async (params?: ProductQueryParams): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>('/products', { params });
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'> & { categoryId: string | null }): Promise<Product> => {
  const response = await api.post<Product>('/products', product);
  return response.data;
};

export const updateProduct = async (id: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'> & { categoryId: string | null }): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, product);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete<void>(`/products/${id}`);
};
```