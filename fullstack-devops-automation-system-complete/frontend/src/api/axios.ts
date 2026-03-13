```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
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

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);

      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - e.g., token expired, invalid token
        // This is a good place to redirect to login or refresh token
        console.warn('Unauthorized access - redirecting to login');
        localStorage.removeItem('token'); // Clear invalid token
        localStorage.removeItem('user'); // Clear user info
        // Redirect to login page, e.g., window.location.href = '/login';
        // (Better to do this with react-router-dom's navigate in components)
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have necessary permissions
        console.warn('Forbidden access - user lacks permissions');
        // Display a more specific message to the user
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
```