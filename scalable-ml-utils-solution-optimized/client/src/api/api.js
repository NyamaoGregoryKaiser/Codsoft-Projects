import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For sending cookies
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle 401 errors, e.g., redirect to login or show a message
      console.error('Unauthorized access. Redirecting to login or refreshing token.');
      // Example: If token expired, clear it and redirect to login
      // Cookies.remove('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;