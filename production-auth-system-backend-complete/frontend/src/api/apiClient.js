import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 Unauthorized and not a refresh token request itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const decodedRefresh = jwtDecode(refreshToken);
          // Check if refresh token is expired
          if (decodedRefresh.exp * 1000 < Date.now()) {
            console.error("Refresh token expired. Logging out.");
            // Force logout if refresh token is also expired
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login'; // Redirect to login
            return Promise.reject(error);
          }

          // Attempt to refresh token
          const refreshResponse = await apiClient.post('/auth/refresh-token', { refresh_token: refreshToken });
          const { access_token: newAccessToken, refresh_token: newRefreshToken } = refreshResponse.data;

          // Update tokens in localStorage
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Update original request with new access token and retry
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest); // Retry the original request
        } catch (refreshError) {
          console.error("Failed to refresh token or refresh token invalid. Logging out.", refreshError);
          // Clear tokens and redirect to login on refresh failure
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn("No refresh token available. Logging out.");
        // If no refresh token, just clear and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```