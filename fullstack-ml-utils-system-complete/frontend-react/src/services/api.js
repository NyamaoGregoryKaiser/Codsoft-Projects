import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const registerUser = (email, password) =>
  api.post('/auth/register', { email, password });

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

// --- User Profile Endpoints ---
export const getUserProfile = () =>
  api.get('/users/me');

export const updateUserProfile = (userData) =>
  api.put('/users/me', userData); // PUT for full replacement, PATCH for partial update

export const deleteUserProfile = () =>
  api.delete('/users/me');

// --- Model Management Endpoints ---
export const createModel = (modelData) =>
  api.post('/models', modelData);

export const getModels = () =>
  api.get('/models');

export const getModelById = (modelId) =>
  api.get(`/models/${modelId}`);

export const updateModel = (modelId, modelData) =>
  api.put(`/models/${modelId}`, modelData);

export const deleteModel = (modelId) =>
  api.delete(`/models/${modelId}`);

// --- Inference and Data Endpoints ---
export const performInference = (modelId, inputData) =>
  api.post(`/models/${modelId}/infer`, inputData);

export const getDataPointsForModel = (modelId) =>
  api.get(`/models/${modelId}/data`);

export const getDataPointById = (modelId, dataPointId) =>
  api.get(`/models/${modelId}/data/${dataPointId}`);

export default api;
```