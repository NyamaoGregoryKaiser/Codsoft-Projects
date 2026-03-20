import axios, { AxiosInstance, AxiosError } from 'axios';
import { clearLocalStorage, getAccessToken, setAccessToken } from '../utils/localStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Check if the error is due to an expired access token (401 Unauthorized)
    // and ensure it's not the refresh token endpoint itself to avoid infinite loops
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true; // Mark the request as retried
      try {
        const response = await api.post('/auth/refresh-token');
        const { accessToken } = response.data.data;
        setAccessToken(accessToken); // Store the new access token
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`; // Update default header
        return api(originalRequest); // Retry the original request with the new token
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        clearLocalStorage(); // Clear tokens and force re-login
        // Redirect to login page or show a message
        window.location.href = '/login'; // Or use react-router-dom history.push
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;