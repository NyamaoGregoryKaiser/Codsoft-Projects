import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Handle unauthorized or forbidden errors, e.g., redirect to login
      console.error('Authentication error, redirecting to login...', error.response.data);
      // For a real app, you'd want to use react-router-dom's navigate
      // if (window.location.pathname !== '/auth') {
      //   localStorage.removeItem('accessToken');
      //   localStorage.removeItem('user');
      //   window.location.href = '/auth';
      // }
    }
    return Promise.reject(error);
  }
);

export default apiClient;