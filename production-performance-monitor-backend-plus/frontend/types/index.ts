export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  is_admin: boolean;
}

export interface Application {
  id: number;
  name: string;
  description: string | null;
  api_key: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export enum MetricType {
  GAUGE = "gauge",
  COUNTER = "counter",
  HISTOGRAM = "histogram",
  SUMMARY = "summary",
}

export interface Metric {
  id: number;
  app_id: number;
  name: string;
  unit: string | null;
  metric_type: MetricType;
  threshold_warning: number | null;
  threshold_critical: number | null;
  created_at: string;
  updated_at: string;
}

export interface MetricDataPoint {
  id: number;
  metric_id: number;
  value: number;
  timestamp: string; // ISO string
  created_at: string;
  updated_at: string;
}

export interface MetricDataAggregation {
  timestamp: string; // ISO string
  average: number | null;
  min: number | null;
  max: number | null;
  count: number | null;
  sum: number | null;
}