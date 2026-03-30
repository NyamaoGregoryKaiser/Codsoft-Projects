import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes globally
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized, redirecting to login...');
      localStorage.removeItem('accessToken');
      window.location.href = '/login'; // Redirect to login page
    } else if (error.response && error.response.status === 403) {
        console.error('Forbidden access.');
    }
    return Promise.reject(error);
  }
);

export default api;