import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for Flask-JWT-Extended handling of cookies if used, or just for general CORS
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry and refreshing
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Check for 401 response and if it's not a login/refresh request
    if (error.response?.status === 401 && !originalRequest._retry && error.response?.data?.msg !== 'Bad credentials') {
      originalRequest._retry = true; // Mark request as retried
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        console.error('No refresh token available. Redirecting to login.');
        // This usually means the user needs to log in again
        localStorage.clear();
        window.location = '/login'; // Redirect to login page
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token...');
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
          },
          withCredentials: true,
        });

        const newAccessToken = refreshResponse.data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        console.log('Token refreshed successfully. Retrying original request.');
        // Update the original request's header with the new access token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Refresh token failed or is invalid, force logout
        localStorage.clear();
        window.location = '/login'; // Redirect to login page
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```