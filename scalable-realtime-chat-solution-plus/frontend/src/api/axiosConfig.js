```javascript
/**
 * @file Axios instance configuration for the frontend.
 * @module api/axiosConfig
 */

import axios from 'axios';
import { getToken } from '../utils/localStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // If you're handling cookies, otherwise remove
});

// Request interceptor to add JWT token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling (e.g., token expiration)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle token expiration or invalid token globally
            console.error('Unauthorized request. Redirecting to login...');
            // Optional: Clear token and redirect to login
            // removeToken();
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
```