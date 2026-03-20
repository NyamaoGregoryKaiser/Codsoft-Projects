import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
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
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || 'An unexpected error occurred.';

      // Specific handling for common errors
      if (status === 401) {
        errorMessage = 'Unauthorized: Please log in again.';
        Cookies.remove('token'); // Clear invalid token
        window.location.href = '/login'; // Redirect to login
      } else if (status === 403) {
        errorMessage = 'Forbidden: You do not have permission to access this resource.';
      } else if (status === 404) {
        errorMessage = data.message || 'Resource not found.';
      } else if (status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      }

      toast.error(errorMessage);
      return Promise.reject(new Error(errorMessage)); // Reject with a user-friendly error
    } else if (error.request) {
      toast.error('No response from server. Please check your network connection.');
      return Promise.reject(new Error('Network Error'));
    } else {
      toast.error('An error occurred while setting up the request.');
      return Promise.reject(new Error('Request Setup Error'));
    }
  }
);

// Auth Endpoints
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// DbInstance Endpoints (Mocked for now, assuming a default DbInstance ID for this demo)
// In a real app, you'd have endpoints to list/create DbInstances
const defaultDbInstanceId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Use a consistent mock ID or fetch from context

export const dbOptimizerApi = {
  // Queries
  getSlowQueries: (dbInstanceId = defaultDbInstanceId, params) => api.get(`/queries/${dbInstanceId}`, { params }),
  getQueryDetails: (dbInstanceId = defaultDbInstanceId, queryId) => api.get(`/queries/${dbInstanceId}/${queryId}`),
  getQueryExplanations: (dbInstanceId = defaultDbInstanceId, queryId) => api.get(`/queries/${dbInstanceId}/${queryId}/explanations`),

  // Indexes
  getIndexSuggestions: (dbInstanceId = defaultDbInstanceId, params) => api.get(`/indexes/${dbInstanceId}`, { params }),
  updateIndexSuggestionStatus: (dbInstanceId = defaultDbInstanceId, suggestionId, status) => api.put(`/indexes/${dbInstanceId}/${suggestionId}/status`, { status }),

  // Schema Issues
  getSchemaIssues: (dbInstanceId = defaultDbInstanceId, params) => api.get(`/schemas/${dbInstanceId}`, { params }),
  updateSchemaIssueStatus: (dbInstanceId = defaultDbInstanceId, issueId, status) => api.put(`/schemas/${dbInstanceId}/${issueId}/status`, { status }),

  // Metrics
  getLatestMetrics: (dbInstanceId = defaultDbInstanceId) => api.get(`/metrics/${dbInstanceId}/latest`),
  getMetricHistory: (dbInstanceId = defaultDbInstanceId, params) => api.get(`/metrics/${dbInstanceId}/history`, { params }),
};

export default api;
```

#### `frontend/src/contexts/AuthContext.js`
```javascript