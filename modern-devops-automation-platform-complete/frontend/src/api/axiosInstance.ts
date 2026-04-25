```typescript
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (response) => {
    // Optional: Show success messages
    if (response.config.method !== 'get' && response.data?.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    // Centralized error handling for API calls
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || 'An unexpected error occurred.';

      switch (status) {
        case 400:
          toast.error(`Bad Request: ${errorMessage}`);
          break;
        case 401:
          toast.error(`Unauthorized: ${errorMessage}`);
          // Optionally, redirect to login if token is expired/invalid
          if (errorMessage.toLowerCase().includes('token expired') || errorMessage.toLowerCase().includes('invalid token')) {
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Uncomment for automatic redirect
          }
          break;
        case 403:
          toast.error(`Forbidden: ${errorMessage}`);
          break;
        case 404:
          toast.error(`Not Found: ${errorMessage}`);
          break;
        case 429:
          toast.warn(`Rate Limit Exceeded: ${errorMessage}`);
          break;
        case 500:
          toast.error(`Server Error: ${errorMessage}`);
          break;
        default:
          toast.error(`Error ${status}: ${errorMessage}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server. Please check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error(`Request Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```