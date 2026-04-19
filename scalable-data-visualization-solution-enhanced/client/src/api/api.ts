```typescript
import axios from 'axios';
import { UserRole } from 'types/auth'; // Ensure this path is correct

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error is 401 Unauthorized and not a refresh token request itself
    if (error.response?.status === 401 && !originalRequest._retry && error.response.data?.message !== 'Invalid credentials') {
      originalRequest._retry = true; // Mark request as retried
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest); // Retry the original request with new token
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login'; // Redirect to login page
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<UserProfile>('/auth/me'),
};

// --- Dataset Endpoints ---
export interface Dataset {
  id: string;
  name: string;
  description?: string;
  fileType: 'csv' | 'json';
  data?: string; // Raw data string, included in detail view
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const datasetApi = {
  uploadDataset: (data: FormData) => api.post<any>('/datasets', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getDatasets: () => api.get<Dataset[]>('/datasets'),
  getDatasetById: (id: string) => api.get<Dataset>(`/datasets/${id}`),
  getDatasetData: (id: string) => api.get<any[]>(`/datasets/${id}/data`),
  updateDataset: (id: string, data: Partial<Dataset>) => api.put<Dataset>(`/datasets/${id}`, data),
  deleteDataset: (id: string) => api.delete(`/datasets/${id}`),
};

// --- Visualization Endpoints ---
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  SCATTER = 'scatter',
  TABLE = 'table',
}

export interface ChartConfig {
  labelsField: string;
  dataField: string;
  title?: string;
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface Visualization {
  id: string;
  name: string;
  description?: string;
  chartType: ChartType;
  config: ChartConfig;
  userId: string;
  datasetId?: string;
  dataset?: Dataset; // Nested dataset info
  createdAt: string;
  updatedAt: string;
}

export const visualizationApi = {
  createVisualization: (data: Omit<Visualization, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'dataset'>) => api.post<Visualization>('/visualizations', data),
  getVisualizations: () => api.get<Visualization[]>('/visualizations'),
  getVisualizationById: (id: string) => api.get<Visualization>(`/visualizations/${id}`),
  getVisualizationData: (id: string) => api.get<any>(`/visualizations/${id}/data`), // Returns Chart.js data object or array for table
  updateVisualization: (id: string, data: Partial<Omit<Visualization, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'dataset'>>) => api.put<Visualization>(`/visualizations/${id}`, data),
  deleteVisualization: (id: string) => api.delete(`/visualizations/${id}`),
};

// --- Dashboard Endpoints ---
export interface DashboardLayoutItem {
  i: string; // Visualization ID
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  layout: DashboardLayoutItem[];
  visualizations?: Visualization[]; // Populated when getting single dashboard
  createdAt: string;
  updatedAt: string;
}

export const dashboardApi = {
  createDashboard: (data: Omit<Dashboard, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'visualizations'>) => api.post<Dashboard>('/dashboards', data),
  getDashboards: () => api.get<Dashboard[]>('/dashboards'),
  getDashboardById: (id: string) => api.get<Dashboard>(`/dashboards/${id}`),
  updateDashboard: (id: string, data: Partial<Omit<Dashboard, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'visualizations'>>) => api.put<Dashboard>(`/dashboards/${id}`, data),
  deleteDashboard: (id: string) => api.delete(`/dashboards/${id}`),
};
```