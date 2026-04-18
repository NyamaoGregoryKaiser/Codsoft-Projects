```typescript
import axios from 'axios';
import { getToken, deleteToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to protected requests
api.interceptors.request.use(
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

// Response interceptor to handle token expiration/invalidity
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or invalid, or unauthorized access
      console.warn("Unauthorized API request. Clearing token and redirecting to login.");
      deleteToken();
      // Optionally redirect to login page or dispatch a logout action
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

// --- Service Endpoints ---
export interface Service {
  id: number;
  name: string;
  description: string;
  api_key?: string; // api_key might only be returned on creation
}

export interface CreateServiceRequest {
  name: string;
  description: string;
}

export const createService = async (serviceData: CreateServiceRequest): Promise<Service> => {
  const response = await api.post<Service>('/services', serviceData);
  return response.data;
};

export const getAllServices = async (): Promise<Service[]> => {
  const response = await api.get<Service[]>('/services');
  return response.data;
};

// --- Metric Endpoints ---
export interface MetricTag {
    [key: string]: string | number | boolean;
}

export interface MetricIngestDTO {
  metric_type: string;
  value: number;
  tags?: MetricTag;
}

export interface BatchMetricIngestDTO {
    metrics: MetricIngestDTO[];
}

export interface MetricResponseDTO {
  id: number;
  service_id: number;
  timestamp: string; // ISO 8601 string
  metric_type: string;
  value: number;
  tags?: MetricTag;
}

export interface MetricQueryParams {
  metric_type?: string;
  start_time?: string; // ISO 8601
  end_time?: string;   // ISO 8601
  limit?: number;
  offset?: number;
}

export const ingestMetrics = async (apiKey: string, metrics: MetricIngestDTO | BatchMetricIngestDTO): Promise<any> => {
    const headers = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' };
    const response = await axios.post(`${API_BASE_URL}/metrics`, metrics, { headers });
    return response.data;
};

export const getMetricsForService = async (serviceId: number, params?: MetricQueryParams): Promise<MetricResponseDTO[]> => {
  const response = await api.get<MetricResponseDTO[]>(`/metrics/${serviceId}`, { params });
  return response.data;
};

// --- Alert Endpoints (Conceptual/Future) ---
export interface AlertRule {
    id: number;
    service_id?: number; // Optional, can be null for global rules
    name: string;
    metric_type: string;
    threshold: number;
    operator: string; // e.g., '>', '<', '>=', '<=', '='
    duration_seconds: number;
    status: 'active' | 'inactive';
    target_email?: string;
    created_at?: string;
    updated_at?: string;
}

export const getAllAlertRules = async (serviceId?: number): Promise<AlertRule[]> => {
    const params = serviceId ? { service_id: serviceId } : {};
    const response = await api.get<AlertRule[]>('/alerts/rules', { params });
    return response.data;
};

export const createAlertRule = async (rule: Partial<AlertRule>): Promise<AlertRule> => {
    const response = await api.post<AlertRule>('/alerts/rules', rule);
    return response.data;
};

export const updateAlertRule = async (ruleId: number, updates: Partial<AlertRule>): Promise<AlertRule> => {
    const response = await api.put<AlertRule>(`/alerts/rules/${ruleId}`, updates);
    return response.data;
};

export const deleteAlertRule = async (ruleId: number): Promise<void> => {
    await api.delete(`/alerts/rules/${ruleId}`);
};
```