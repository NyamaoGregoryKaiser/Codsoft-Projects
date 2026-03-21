```javascript
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Authorization header if a token exists
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // You might want to refresh token here, or just force logout
      // For now, we'll just log out.
      toast.error("Session expired or unauthorized. Please log in again.");
      localStorage.removeItem('access_token');
      window.location.href = '/login'; // Redirect to login page
      return Promise.reject(error);
    }

    // Generic error handling
    if (error.response) {
      console.error("API Error Response:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      // You can display specific messages based on status codes or error details
      // toast.error(error.response.data.detail || "An API error occurred.");
    } else if (error.request) {
      // Request was made but no response received
      console.error("API Error Request:", error.request);
      toast.error("No response from server. Please check your network connection.");
    } else {
      // Something else happened while setting up the request
      console.error("API Error Message:", error.message);
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);
```