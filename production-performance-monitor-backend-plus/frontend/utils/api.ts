import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

interface CustomAxiosInstance extends AxiosInstance {
  setAuthToken: (token: string | null) => void;
  getAuthToken: () => string | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const axiosInstance: CustomAxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // Important for sending/receiving HTTP-only cookies
}) as CustomAxiosInstance;

let accessToken: string | null = null; // In-memory store for access token

// Request interceptor to add the access token
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and refresh logic
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    // Check for 401 Unauthorized (and not a login request itself)
    if (error.response?.status === 401 && originalRequest && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      console.log("401 Unauthorized, attempting token refresh...");

      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        try {
          const refreshResponse = await axiosInstance.post('/api/v1/auth/refresh', {}); // Refresh token sent via cookie
          const { access_token: newAccessToken } = refreshResponse.data;
          
          axiosInstance.setAuthToken(newAccessToken); // Update in-memory token
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed, redirecting to login:", refreshError);
          // Clear tokens and redirect to login
          axiosInstance.setAuthToken(null);
          Cookies.remove("refresh_token");
          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn("No refresh token found for 401, redirecting to login.");
        axiosInstance.setAuthToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

axiosInstance.setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("access_token", token);
  } else {
    localStorage.removeItem("access_token");
  }
};

axiosInstance.getAuthToken = () => {
    if (!accessToken) {
        accessToken = localStorage.getItem("access_token");
    }
    return accessToken;
};

// Initialize with any token from local storage on first load
axiosInstance.getAuthToken();


export const api = axiosInstance;

// SWR fetcher utility
export const fetcher = (url: string) => api.get(url).then(res => res.data);