```javascript
import apiClient from './apiClient';

export const getAllPosts = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get(`/posts?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getPostById = async (id) => {
  try {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createPost = async (postData) => {
  try {
    const response = await apiClient.post('/posts/', postData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await apiClient.put(`/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deletePost = async (id) => {
  try {
    const response = await apiClient.delete(`/posts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```