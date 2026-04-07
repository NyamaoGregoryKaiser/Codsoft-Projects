```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token to requests
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

// Interceptor for handling global errors (e.g., token expiration)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error response exists and contains a status
    if (error.response && error.response.status) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Authentication/Authorization error:', error.response.data.message);
        // Optionally, redirect to login page or show a global error message
        // This is a simple example, in a full app you might dispatch an action
        // or use the AuthContext to logout the user.
        // For now, we'll let the specific component handle the error,
        // but this is where a global redirect could happen.
        // window.location.href = '/login';
      }
    }
    // Re-throw the error so specific components can handle it
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);

export default api;
```