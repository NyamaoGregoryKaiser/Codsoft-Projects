```javascript
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
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
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is due to an expired access token (401 Unauthorized)
    // and that it's not a login/register request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token, or logout occurred, redirect to login
        console.warn("No refresh token available. Redirecting to login.");
        localStorage.clear();
        window.location = '/login'; // Or use react-router-dom history.push
        return Promise.reject(error);
      }

      try {
        // Check if refresh token is also expired
        const decodedRefresh = jwtDecode(refreshToken);
        if (decodedRefresh.exp < Date.now() / 1000) {
          console.warn("Refresh token expired. Redirecting to login.");
          localStorage.clear();
          window.location = '/login';
          return Promise.reject(error);
        }

        console.log("Access token expired, attempting to refresh...");
        // Call the refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

        // Store new tokens
        localStorage.setItem('accessToken', access_token);
        // The backend example returns the same refresh token, but in a real app, it might issue a new one
        if (newRefreshToken) { 
            localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        console.log("Tokens refreshed successfully.");

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.error("Failed to refresh tokens:", refreshError);
        // If refresh fails, clear tokens and redirect to login
        localStorage.clear();
        window.location = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```