```typescript
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/auth'; // This would cause a full page reload, better to dispatch context action
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```