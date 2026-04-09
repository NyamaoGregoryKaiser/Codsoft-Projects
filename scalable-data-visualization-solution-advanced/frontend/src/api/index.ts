```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving HTTP-only cookies
});

// Request interceptor to potentially add tokens if not using cookies, or modify requests
api.interceptors.request.use(
  (config) => {
    // Example: if using localStorage token (less secure), attach it here
    // const token = localStorage.getItem('accessToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors, especially 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (refreshResponse.status === 200) {
          // Token refreshed successfully, retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        console.error('Failed to refresh token:', refreshError);
        window.location.href = '/login'; // Redirect to login page
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```