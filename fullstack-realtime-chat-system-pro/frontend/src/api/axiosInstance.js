import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (e.g., redirect to login on 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - redirecting to login');
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('jwtToken');
      // Using window.location for a full refresh to clear app state.
      // In a more complex app, you might use history.push and manage state carefully.
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;