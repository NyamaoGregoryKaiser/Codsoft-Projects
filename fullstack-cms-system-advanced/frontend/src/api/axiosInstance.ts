import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { AuthTokens, User } from '../types';

const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any | null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('authTokens');
    if (tokens) {
      const { accessToken } = JSON.parse(tokens) as AuthTokens;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401, or already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Try to refresh token
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = 'Bearer ' + token;
        return axiosInstance(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const tokens = localStorage.getItem('authTokens');
      if (!tokens) {
        throw new Error('No refresh token found');
      }
      const { refreshToken } = JSON.parse(tokens) as AuthTokens;

      const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
      const newAccessToken = res.data.accessToken;

      localStorage.setItem('authTokens', JSON.stringify({ accessToken: newAccessToken, refreshToken }));
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken); // Resolve all pending requests with new token
      return axiosInstance(originalRequest);
    } catch (_error) {
      processQueue(_error, null); // Reject all pending requests
      localStorage.removeItem('authTokens'); // Clear tokens on refresh failure
      window.location.href = '/login'; // Redirect to login page
      return Promise.reject(_error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;