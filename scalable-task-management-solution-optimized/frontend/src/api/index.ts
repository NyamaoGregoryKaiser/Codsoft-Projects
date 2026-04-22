import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
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
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.log('Unauthorized request. Redirecting to login...');
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Or use Next.js router
    }
    return Promise.reject(error);
  }
);

export default api;