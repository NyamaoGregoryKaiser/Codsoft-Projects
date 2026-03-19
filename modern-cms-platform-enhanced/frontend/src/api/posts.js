```javascript
import apiClient from './apiClient';

export const getPublishedPosts = async () => {
  const response = await apiClient.get('/posts/published');
  return response.data;
};

export const getAllPosts = async () => {
  const response = await apiClient.get('/posts');
  return response.data;
};

export const getPost = async (identifier) => {
  const response = await apiClient.get(`/posts/${identifier}`);
  return response.data;
};

export const createPost = async (postData) => {
  const response = await apiClient.post('/posts', postData);
  return response.data;
};

export const updatePost = async (id, postData) => {
  const response = await apiClient.put(`/posts/${id}`, postData);
  return response.data;
};

export const deletePost = async (id) => {
  const response = await apiClient.delete(`/posts/${id}`);
  return response.data;
};

export const uploadFeaturedImage = async (postId, file) => {
  const formData = new FormData();
  formData.append('featuredImage', file);

  const response = await apiClient.post(`/posts/${postId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await apiClient.post('/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const response = await apiClient.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};

export const getTags = async () => {
  const response = await apiClient.get('/tags');
  return response.data;
};

export const createTag = async (tagData) => {
  const response = await apiClient.post('/tags', tagData);
  return response.data;
};

export const updateTag = async (id, tagData) => {
  const response = await apiClient.put(`/tags/${id}`, tagData);
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await apiClient.delete(`/tags/${id}`);
  return response.data;
};

export const getUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await apiClient.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};
```