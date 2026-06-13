import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
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

// Response interceptor to handle token expiry or other global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, log out the user
      console.warn('Authentication token expired or invalid. Logging out...');
      localStorage.removeItem('token');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getUserProfile = () => api.get('/auth/me');

// --- User Endpoints (Admin-only for most) ---
export const getAllUsers = (params) => api.get('/users', { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// --- Post Endpoints ---
export const getPosts = (params) => api.get('/posts', { params });
export const getPost = (identifier) => api.get(`/posts/${identifier}`);
export const createPost = (postData) => api.post('/posts', postData);
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData);
export const deletePost = (id) => api.delete(`/posts/${id}`);

// --- Category Endpoints ---
export const getCategories = (params) => api.get('/categories', { params });
export const getCategory = (identifier) => api.get(`/categories/${identifier}`);
export const createCategory = (categoryData) => api.post('/categories', categoryData);
export const updateCategory = (id, categoryData) => api.put(`/categories/${id}`, categoryData);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// --- Media Endpoints ---
export const uploadMedia = (formData) => api.post('/media/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const getMediaFiles = (params) => api.get('/media', { params });
export const getMediaFile = (id) => api.get(`/media/${id}`);
export const deleteMedia = (id) => api.delete(`/media/${id}`);

export default api;