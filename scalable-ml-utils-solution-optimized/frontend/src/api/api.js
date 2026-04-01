```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('access_token');
      // You might want to use a global context or event emitter for redirection
      // For now, a simple window.location.href might suffice for demonstration
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const login = (email, password) => apiClient.post('/auth/login', new URLSearchParams({ username: email, password }));
export const register = (username, email, password) => apiClient.post('/auth/register', { username, email, password });
export const getMe = () => apiClient.get('/auth/me');

// User Endpoints (Admin only - not fully implemented in UI but API exists)
export const getUsers = () => apiClient.get('/users');
export const getUser = (userId) => apiClient.get(`/users/${userId}`);

// Dataset Endpoints
export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/datasets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getDatasets = () => apiClient.get('/datasets');
export const getDataset = (id) => apiClient.get(`/datasets/${id}`);
export const getDatasetPreview = (id, rows = 5) => apiClient.get(`/datasets/${id}/preview?rows=${rows}`);
export const updateDataset = (id, data) => apiClient.put(`/datasets/${id}`, data);
export const deleteDataset = (id) => apiClient.delete(`/datasets/${id}`);

// Model Endpoints
export const trainModel = (modelData) => apiClient.post('/models/train', modelData);
export const getModels = () => apiClient.get('/models');
export const getModel = (id) => apiClient.get(`/models/${id}`);
export const updateModel = (id, data) => apiClient.put(`/models/${id}`, data);
export const deleteModel = (id) => apiClient.delete(`/models/${id}`);
export const predict = (modelId, data) => apiClient.post('/models/predict', { model_id: modelId, data });


// Experiment Endpoints
export const getExperiments = () => apiClient.get('/experiments');
export const getExperiment = (id) => apiClient.get(`/experiments/${id}`);
export const deleteExperiment = (id) => apiClient.delete(`/experiments/${id}`);

export default apiClient;
```