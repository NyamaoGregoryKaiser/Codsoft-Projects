```typescript
import axios, { AxiosInstance } from 'axios';
import { AuthResponse, ErrorResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If you're using cookies/sessions
});

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';

    // Example: Handle token expiry
    if (error.response?.status === 401 && errorMessage.includes('expired') && !originalRequest._retry) {
      originalRequest._retry = true;
      // You might want to refresh token here, or simply redirect to login
      console.error('JWT token expired. Redirecting to login...');
      // Clear local storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login'; // Redirect to login page
      }
      return Promise.reject(error); // Reject the original request
    }

    return Promise.reject(error.response?.data || { message: 'Network Error', status: 'error' } as ErrorResponse);
  }
);

export default apiClient;
```