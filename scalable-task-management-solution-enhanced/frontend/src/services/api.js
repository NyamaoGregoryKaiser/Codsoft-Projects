import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or invalidity
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    // Check if the error is 401 Unauthorized and it's not the login attempt itself
    if (error.response?.status === 401 && originalRequest.url !== '/auth/login') {
      // Potentially refresh token or redirect to login
      // For simplicity, we'll just remove the token and let AuthContext handle redirect
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      // You might want to dispatch an event or use a global state manager to force logout
      // For now, AuthContext's checkAuth will handle this on next render or direct call
      console.error("API call received 401. Token might be expired or invalid. Logging out client-side.");
    }
    return Promise.reject(error);
  }
);

export default api;