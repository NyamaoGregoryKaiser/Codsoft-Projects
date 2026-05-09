```javascript
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving HttpOnly cookies
});

// Request interceptor to attach access token to requests
apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000; // in seconds
      
      // If access token is expired, try to refresh
      if (decodedToken.exp < currentTime - 60) { // Check 60 seconds before actual expiry for buffer
        console.log("Access token expired, attempting to refresh...");
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
          accessToken = refreshResponse.data.access_token;
          localStorage.setItem('accessToken', accessToken);
          console.log("Access token refreshed successfully.");
        } catch (error) {
          console.error("Error refreshing token:", error);
          // If refresh fails, remove tokens and redirect to login
          localStorage.removeItem('accessToken');
          Cookies.remove('refresh_token');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(error);
        }
      }
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry or unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If we get a 401 and it's not the refresh token endpoint itself,
    // and we haven't already tried refreshing, try to refresh the token.
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true; // Mark request as retried
      
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = refreshResponse.data.access_token;
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("Token refreshed in response interceptor, retrying original request.");
        return apiClient(originalRequest); // Retry the original request with new token
      } catch (refreshError) {
        console.error("Refresh token failed, logging out:", refreshError);
        localStorage.removeItem('accessToken');
        Cookies.remove('refresh_token');
        window.location.href = '/login'; // Redirect to login page
        return Promise.reject(refreshError);
      }
    }
    // For other 401s (e.g., direct login failures, invalid credentials) or other errors,
    // or if refresh also failed, simply reject.
    return Promise.reject(error);
  }
);

export default apiClient;
```