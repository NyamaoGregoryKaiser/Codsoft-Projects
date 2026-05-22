```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending/receiving cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header (if token is available)
// Not strictly needed if using http-only cookies, but good for other auth methods
axiosInstance.interceptors.request.use(
  (config) => {
    // You could retrieve token from localStorage if you were using bearer tokens in JS
    // For http-only cookies, the browser handles sending the 'jwt' cookie automatically.
    // This interceptor mainly serves if you decide to use 'Bearer' tokens in header.
    // const token = localStorage.getItem('jwtToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('API Error Response:', error.response.data);
      // Example: If 401 Unauthorized, you might redirect to login
      if (error.response.status === 401) {
        // Potentially clear auth context or redirect
        console.log('Unauthorized. User might need to log in again.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error Request:', error.request);
    } else {
      // Something else happened while setting up the request
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```