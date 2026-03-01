import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_BASE_URL + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
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

// Response interceptor to handle token expiry or other global errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Example: if 401 Unauthorized, redirect to login
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized, redirecting to login...');
      // Clear token and redirect, but only if not already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('access_token');
        window.location.href = '/login'; // Simple redirect for SPA
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```