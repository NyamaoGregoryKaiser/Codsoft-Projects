import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      // Check if token is expired
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token'); // Clear expired token
        // Optionally redirect to login or notify user
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired. Please log in again.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;