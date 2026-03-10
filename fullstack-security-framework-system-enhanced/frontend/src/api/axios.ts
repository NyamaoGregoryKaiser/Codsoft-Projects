import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Interceptor for handling token refresh automatically
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check for 401 Unauthorized response and ensure it's not a login attempt
    if (error.response?.status === 401 && !originalRequest._retry && error.response.config.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token
        await apiClient.post('/auth/refresh-token');
        // If refresh is successful, retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle globally
        console.error('Failed to refresh token:', refreshError);
        // Clear auth state and redirect to login
        window.location.href = '/login'; // Or use React Router navigate
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;