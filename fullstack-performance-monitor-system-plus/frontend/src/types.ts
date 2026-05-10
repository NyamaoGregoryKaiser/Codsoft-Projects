export type User = {
  id: string;
  name: string;
  email: string;
};

export type Project = {
  id: string;
  name: string;
  apikey: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type MetricType = 'LCP' | 'FID' | 'CLS' | 'API_RESPONSE' | 'ERROR' | 'CUSTOM';
export type MetricPeriod = '1h' | '6h' | '12h' | '1d' | '7d' | '30d';

export type MetricDataPoint = {
  timestamp: string;
  value: number;
};

export type MetricSummary = {
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
};

export type ProjectSummaryMetrics = {
  LCP: MetricSummary;
  FID: MetricSummary;
  CLS: MetricSummary;
  totalErrors: number;
  // Add other summary metrics as needed
};

export type ErrorMetric = {
  id: string;
  timestamp: string;
  context: {
    message: string;
    url: string;
    stack?: string;
    [key: string]: any;
  };
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
};

export type AuthActions = {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
};

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};