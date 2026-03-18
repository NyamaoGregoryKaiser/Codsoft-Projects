```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('tokens'));
    if (tokens && tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response.data, // Return data object directly from ApiResponse
  async (error) => {
    const originalRequest = error.config;
    const tokens = JSON.parse(localStorage.getItem('tokens'));

    // If error is 401 Unauthorized and not a refresh token request, try to refresh
    if (error.response.status === 401 && !originalRequest._retry && tokens && tokens.refresh) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
          refreshToken: tokens.refresh.token,
        });
        localStorage.setItem('tokens', JSON.stringify(refreshResponse.data.data.tokens));
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.tokens.access.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear tokens and redirect to login
        localStorage.removeItem('tokens');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // If error is 403 Forbidden or 401 after retry, or other unhandled errors
    if (error.response.status === 403 || (error.response.status === 401 && originalRequest._retry)) {
      localStorage.removeItem('tokens');
      window.location.href = '/login';
    }

    return Promise.reject(error.response.data || error.message);
  }
);

export default apiClient;
```