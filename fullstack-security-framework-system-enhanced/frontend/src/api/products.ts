import apiClient from './axios';
import { Product, ProductCreateData, ProductUpdateData } from 'types/product';

export const getProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get('/products');
  return response.data.data.products;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data.data;
};

export const createProduct = async (data: ProductCreateData): Promise<Product> => {
  const response = await apiClient.post('/products', data);
  return response.data.data;
};

export const updateProduct = async (id: string, data: ProductUpdateData): Promise<Product> => {
  const response = await apiClient.patch(`/products/${id}`, data);
  return response.data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};