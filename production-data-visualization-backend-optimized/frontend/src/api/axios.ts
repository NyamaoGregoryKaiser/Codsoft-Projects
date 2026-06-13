```typescript
import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If you plan to use cookies/sessions
});

// Set JWT token from localStorage if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for error handling, e.g., refreshing tokens or redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example: If 401 Unauthorized and not a login/register request, redirect to login
    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;
      // Prevent infinite loops if token refresh fails or if it's already a login request
      if (!originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/register')) {
        originalRequest._retry = true;
        // You might attempt token refresh here, or just force logout
        console.error('Unauthorized, logging out...');
        localStorage.removeItem('token');
        // This might cause issues if not handled by context or router directly
        window.location.href = '/login'; // Force redirect to login page
      }
    }
    return Promise.reject(error);
  }
);


export default api;
```