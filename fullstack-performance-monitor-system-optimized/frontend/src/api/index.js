```javascript
import axios from 'axios';
import { toast } from 'react-toastify';
import { getToken, removeToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Optionally, show success messages from API if present
    if (response.data && response.data.message) {
      // toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || 'An unexpected error occurred.';

      // Handle specific error codes
      if (status === 401) {
        // Unauthorized - token expired or invalid
        if (!originalRequest._retry) { // Prevent infinite retry loop
          originalRequest._retry = true;
          removeToken(); // Clear invalid token
          toast.error(errorMessage || 'Session expired. Please log in again.');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(error);
        }
      } else if (status === 403) {
        // Forbidden
        toast.error(errorMessage || 'You do not have permission to perform this action.');
      } else if (status === 404) {
        // Not Found
        toast.error(errorMessage || 'Resource not found.');
      } else if (status === 409) {
        // Conflict
        toast.warn(errorMessage || 'A resource with this identifier already exists.');
      } else if (status >= 500) {
        // Server Errors
        toast.error(errorMessage || 'Server error. Please try again later.');
      } else if (status >= 400) {
        // Other client-side errors
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response from server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('Request setup error: ' + error.message);
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);

// --- User Profile Endpoints ---
export const getMyProfile = () => api.get('/users/me');
export const updateMyProfile = (userData) => api.patch('/users/me', userData);
export const deleteMyAccount = () => api.delete('/users/me');

// --- Application Endpoints ---
export const getApplications = () => api.get('/applications');
export const getApplicationById = (appId) => api.get(`/applications/${appId}`);
export const createApplication = (appData) => api.post('/applications', appData);
export const updateApplication = (appId, appData) => api.patch(`/applications/${appId}`, appData);
export const deleteApplication = (appId) => api.delete(`/applications/${appId}`);
export const regenerateApiKey = (appId) => api.post(`/applications/${appId}/regenerate-api-key`);

// --- Metric & Alert Endpoints ---
export const getMetricsForApp = (appId, metricType, period = '24h') =>
  api.get(`/metrics/${appId}/data/${metricType}`, { params: { period } });
export const getAlertsForApp = (appId) => api.get(`/metrics/${appId}/alerts`);
export const createAlertForApp = (appId, alertData) => api.post(`/metrics/${appId}/alerts`, alertData);
export const updateAlert = (alertId, alertData) => api.patch(`/metrics/alerts/${alertId}`, alertData);
export const deleteAlert = (alertId) => api.delete(`/metrics/alerts/${alertId}`);

export default api;
```