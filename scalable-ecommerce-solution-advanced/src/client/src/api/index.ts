import axios from 'axios';
import { AuthTokens } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null') as AuthTokens | null;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error status is 401 Unauthorized and it's not a login/register request
    // and we haven't tried to refresh the token for this request already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried
      const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null') as AuthTokens | null;

      if (tokens?.refreshToken) {
        try {
          // Attempt to refresh token
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens: AuthTokens = refreshResponse.data.tokens;
          localStorage.setItem('authTokens', JSON.stringify(newTokens));
          
          // Update the original request's header with the new access token
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          
          // Re-send the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('authTokens');
          localStorage.removeItem('user');
          window.location.href = '/login'; // Or use a router method
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;