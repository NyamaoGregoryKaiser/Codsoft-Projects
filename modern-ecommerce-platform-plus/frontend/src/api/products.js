import axios from './axiosConfig';

export const getProducts = (params = {}) => {
  return axios.get('/products', { params });
};

export const getProductById = (productId) => {
  return axios.get(`/products/${productId}`);
};

export const createProduct = (productData) => {
  return axios.post('/products', productData);
};

export const updateProduct = (productId, productData) => {
  return axios.put(`/products/${productId}`, productData);
};

export const deleteProduct = (productId) => {
  return axios.delete(`/products/${productId}`);
};