```javascript
import axios from 'axios';

// Configure Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api/v1', // Proxy handles /api/v1 in dev, absolute URL in prod
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (e.g., refreshing tokens, logging out)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Example: If token expires or is invalid (401 Unauthorized), redirect to login
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Token might be invalid or expired. Redirecting to login.');
      localStorage.removeItem('token');
      // Using window.location to force a full reload and clear React state
      // In a more sophisticated app, you might use history.push and context to update state
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```