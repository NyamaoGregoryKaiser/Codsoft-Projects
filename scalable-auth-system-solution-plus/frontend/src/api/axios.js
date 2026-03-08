import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending/receiving cookies (if used)
});

// Request interceptor to add JWT token to headers
instance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Specific error handling for 429 Too Many Requests (Rate Limit)
    if (error.response?.status === 429) {
        const retryAfter = error.response.headers['x-rate-limit-retry-after-seconds'];
        toast.error(`Too many requests. Please try again in ${retryAfter || 60} seconds.`);
        return Promise.reject(error);
    }

    // Handle 401 Unauthorized for expired access tokens
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      const refreshToken = Cookies.get('refreshToken');

      if (refreshToken) {
        try {
          const rs = await instance.post('/auth/refresh-token', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = rs.data;

          Cookies.set('accessToken', newAccessToken, { expires: 1/24, secure: true, sameSite: 'Strict' }); // 1 hour
          Cookies.set('refreshToken', newRefreshToken, { expires: 7, secure: true, sameSite: 'Strict' }); // 7 days

          // Update the original request's header with the new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return instance(originalRequest); // Retry the original request
        } catch (refreshError) {
          // If refresh token fails, log out user
          console.error("Failed to refresh token:", refreshError);
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          localStorage.removeItem('user');
          toast.error("Your session has expired. Please log in again.");
          window.location.href = '/login'; // Redirect to login page
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, just redirect to login
        toast.error("Please log in to continue.");
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Generic error handling
    if (error.response) {
      const errorMessage = error.response.data?.message || error.message || 'An unexpected error occurred.';
      console.error('API Error:', error.response.status, errorMessage, error.response.data);
      // toast.error(`Error ${error.response.status}: ${errorMessage}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      // toast.error('No response from server. Please check your network connection.');
    } else {
      console.error('Request setup error:', error.message);
      // toast.error('An error occurred while setting up the request.');
    }

    return Promise.reject(error);
  }
);

export default instance;
```