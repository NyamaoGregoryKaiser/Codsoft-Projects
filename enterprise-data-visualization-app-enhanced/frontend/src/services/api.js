```javascript
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 Unauthorized and not a refresh token request itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      const refreshToken = Cookies.get('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` },
            withCredentials: true
          });
          const newAccessToken = res.data.access_token;
          Cookies.set('access_token', newAccessToken, { expires: 1/24 }); // Update cookie
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`; // Update header for original request
          return api(originalRequest); // Retry the original request
        } catch (refreshError) {
          console.error("Refresh token failed:", refreshError);
          // If refresh token fails, log out user
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        Cookies.remove('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```