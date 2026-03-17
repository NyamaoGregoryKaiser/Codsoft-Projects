import axios from 'axios';
import { store } from '../store/store'; // Assuming you have Redux store

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token; // Get token from Redux store
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
      // Dispatch logout action if token is expired or invalid
      // store.dispatch(logout()); // Assuming a logout action exists
      console.error("Authentication error: Unauthorized (401).");
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;