import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, removeTokens, isAuthenticated } from './auth';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // If error status is 401 (Unauthorized) and it's not the refresh token endpoint itself,
        // and we haven't tried to refresh yet for this request
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark request as retried
            try {
                const newAccessToken = await refreshToken(); // Attempt to refresh token
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest); // Retry the original request with new token
            } catch (refreshError) {
                // Refresh failed, or no refresh token. Redirect to login.
                console.error("Failed to refresh token, redirecting to login.", refreshError);
                removeTokens();
                window.location.href = '/login'; // Redirect to login page
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;