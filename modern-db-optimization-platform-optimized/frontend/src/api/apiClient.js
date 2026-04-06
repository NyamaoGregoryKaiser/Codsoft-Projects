import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Or use useNavigate from react-router-dom
      // For now, let individual components handle 401 or rely on AuthContext.
    }
    return Promise.reject(error);
  }
);

export default apiClient;