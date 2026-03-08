```javascript
import axios from 'axios';
import AuthService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
});

// Request interceptor to attach JWT token to outgoing requests
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

// Response interceptor to handle token expiration or unauthorized responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Here, we would ideally have a refresh token mechanism.
        // For simplicity with express-session and JWT, if the session expires,
        // the user needs to re-login. The current JWT `accessToken` in localStorage
        // is meant to be short-lived. A 401 on an API protected by `auth()`
        // means the JWT is invalid or expired.
        // If using refresh tokens, uncomment and implement the following:
        // const newAccessToken = await AuthService.refreshToken();
        // localStorage.setItem('accessToken', newAccessToken);
        // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        // return apiClient(originalRequest);

        // For this setup, a 401 after JWT expiry means force logout
        AuthService.logout(); // Clear local storage and redirect
        window.location.href = '/login'; // Redirect to login page
      } catch (refreshError) {
        AuthService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service (API calls related to authentication)
export const authApi = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
};

// Project Service (API calls related to projects)
export const projectApi = {
  createProject: (projectData) => apiClient.post('/projects', projectData),
  getProjects: () => apiClient.get('/projects'),
  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),
  updateProject: (projectId, updateData) => apiClient.patch(`/projects/${projectId}`, updateData),
  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),
  generateNewApiKey: (projectId) => apiClient.post(`/projects/${projectId}/generate-api-key`),
};

// Metric Service (API calls related to metrics)
export const metricApi = {
  getMetrics: (projectId, queryParams) => apiClient.get(`/metrics/${projectId}`, { params: queryParams }),
  getAggregatedMetrics: (projectId, queryParams) => apiClient.get(`/metrics/${projectId}/aggregated`, { params: queryParams }),
  // Note: Metric ingestion is via API key and typically done by the monitored app, not the frontend.
  // So there's no frontend API for ingest.
};

// Alert Service (API calls related to alerts)
export const alertApi = {
  createAlert: (projectId, alertData) => apiClient.post(`/projects/${projectId}/alerts`, alertData),
  getAlerts: (projectId) => apiClient.get(`/projects/${projectId}/alerts`),
  getAlert: (projectId, alertId) => apiClient.get(`/projects/${projectId}/alerts/${alertId}`),
  updateAlert: (projectId, alertId, updateData) => apiClient.patch(`/projects/${projectId}/alerts/${alertId}`, updateData),
  deleteAlert: (projectId, alertId) => apiClient.delete(`/projects/${projectId}/alerts/${alertId}`),
  getAlertIncidents: (projectId, queryParams) => apiClient.get(`/projects/${projectId}/incidents`, { params: queryParams }),
  updateAlertIncidentStatus: (projectId, incidentId, status) => apiClient.patch(`/projects/${projectId}/incidents/${incidentId}/status`, { status }),
};

export default apiClient;
```