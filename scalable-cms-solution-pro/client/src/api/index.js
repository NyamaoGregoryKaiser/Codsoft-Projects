```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry or unauthorized errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized.
      // You might want to automatically logout the user
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);


// --- Auth API ---
export const login = (credentials) => axiosInstance.post('/auth/login', credentials);
export const register = (userData) => axiosInstance.post('/auth/register', userData);
export const getMe = () => axiosInstance.get('/users/me'); // Protected route


// --- Posts API ---
export const getPosts = (params) => axiosInstance.get('/posts', { params });
export const getPost = (id) => axiosInstance.get(`/posts/${id}`);
export const createPost = (postData, isFormData = false) => {
  if (isFormData) {
    return axiosInstance.post('/posts', postData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.post('/posts', postData);
};
export const updatePost = (id, postData, isFormData = false) => {
  if (isFormData) {
    return axiosInstance.put(`/posts/${id}`, postData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.put(`/posts/${id}`, postData);
};
export const deletePost = (id) => axiosInstance.delete(`/posts/${id}`);

// --- Categories API ---
export const getCategories = () => axiosInstance.get('/categories');
export const createCategory = (categoryData) => axiosInstance.post('/categories', categoryData);
// ... implement update and delete category

// --- Users API ---
export const getUsers = (params) => axiosInstance.get('/users', { params });
export const getUser = (id) => axiosInstance.get(`/users/${id}`);
// ... implement updateUser, deleteUser


// --- Media API ---
export const getMedia = () => axiosInstance.get('/media');
export const uploadMedia = (formData) => axiosInstance.post('/media', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteMedia = (id) => axiosInstance.delete(`/media/${id}`);

export default axiosInstance;
```