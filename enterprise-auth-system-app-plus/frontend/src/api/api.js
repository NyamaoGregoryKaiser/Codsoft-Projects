import axios from 'axios';

// Determine the API base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if a token exists in localStorage
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

// Interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is due to unauthorized access (e.g., token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access. Redirecting to login...');
      localStorage.removeItem('accessToken'); // Clear invalid token
      // You might want to trigger a global logout or redirect to login page here
      // For example, using a custom event or a global state manager
      window.location.href = '/login'; // Simple redirect for demonstration
    }
    return Promise.reject(error);
  }
);

export default api;