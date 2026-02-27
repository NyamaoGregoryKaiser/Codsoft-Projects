```typescript
import axios from 'axios';
import { LoginCredentials, User, RegisterData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving httpOnly cookies
});

// Interceptor to attach access token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken'); // Access token typically stored in localStorage or memory if http-only cookie not used
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for handling token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 Unauthorized and not a refresh token request itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      
      // Attempt to refresh token
      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newAccessToken = refreshResponse.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken); // Store new access token
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // Update default header

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`; // Update original request header
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Clear tokens and redirect to login on refresh failure
        localStorage.removeItem('accessToken');
        // No need to remove refresh token explicitly from cookie on client, backend logout handles it or it expires.
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: async (data: RegisterData): Promise<{ user: User; message: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<{ user: User; accessToken: string }> => {
    const response = await api.post('/auth/login', credentials);
    // Access token is returned in the response body. Refresh token is set as an httpOnly cookie.
    const { user, accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    return { user, accessToken };
  },

  logout: async (): Promise<void> => {
    // Backend needs to receive the refresh token cookie for invalidation.
    // The browser will automatically send it because withCredentials is true.
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  // This is a helper to verify current user if token is present (e.g., on app load)
  // It effectively makes a request that will trigger a refresh if needed.
  verifyAuth: async (): Promise<{ user: User }> => {
    const response = await api.get('/users/me'); // A simple protected endpoint to check auth status
    return response.data;
  },
};

export default api; // Export configured axios instance for other API calls
```