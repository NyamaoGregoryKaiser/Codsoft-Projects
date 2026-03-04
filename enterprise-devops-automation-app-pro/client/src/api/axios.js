import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Note: `jwt-decode` is a common choice for frontend.

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
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

// Response interceptor for error handling and potential token refresh (not implemented fully here)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Handle 401 Unauthorized errors
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // You would typically try to refresh the token here using a refresh token
      // For simplicity, we'll just clear the token and redirect to login
      localStorage.removeItem('token');
      // If using React Router, you'd navigate programmatically
      // window.location.href = '/login';
      console.error("Unauthorized request. Token might be expired or invalid. Please log in again.");
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;