```jsx
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Proxy handles /api mapping to backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for handling token expiration and refresh (simplified for example)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If token is expired and it's not a refresh token request itself
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // In a real app, you'd send a refresh token request here
      // For this example, we'll just force logout.
      console.log('Token expired or unauthorized, forcing logout.');
      // window.location.href = '/login'; // Or dispatch a logout action
    }
    return Promise.reject(error);
  }
);

export default api;
```