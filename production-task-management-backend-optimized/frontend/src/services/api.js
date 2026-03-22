```javascript
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || `An error occurred (Status: ${status})`;

      if (status === 401 || status === 403) {
        // Handle unauthorized or forbidden errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error(errorMessage);
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else if (status === 400 || status === 404) {
        toast.error(errorMessage);
      } else {
        toast.error('Server error: Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server. Please check your network connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(error);
  }
);

export default api;
```