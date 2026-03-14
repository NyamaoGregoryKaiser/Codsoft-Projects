```javascript
// client/src/api/products.js
import apiClient from './apiClient';

export const getProducts = async (params) => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response.data;
};

```