```typescript
import api from './axios';
import { Category } from '@types-frontend/entities';

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get<Category>(`/categories/${id}`);
  return response.data;
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await api.post<Category>('/categories', { name });
  return response.data;
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, { name });
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete<void>(`/categories/${id}`);
};
```