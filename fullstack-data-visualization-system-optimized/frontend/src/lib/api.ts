```typescript
// frontend/src/lib/api.ts
import axios from 'axios';
import { getCookie, removeCookie } from './cookies';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore'; // Import the store for logout

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = getCookie('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors, especially auth issues
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite retry loops
      toast.error('Session expired or unauthorized. Please log in again.');
      // Use useAuthStore directly, or dispatch an event that the store listens to
      // This is a common pattern: `useAuthStore.getState().logout()`
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Redirect to login page
      return Promise.reject(error);
    }

    const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
    toast.error(errorMessage); // Display error notification
    return Promise.reject(error);
  }
);

export default api;
```