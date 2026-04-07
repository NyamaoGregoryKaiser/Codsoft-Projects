import { api } from './index';
import { Metric, MetricCreate, MetricUpdate } from '@types';

export const metricsApi = {
  getMetricsByDatabaseId: (dbId: number) =>
    api.get<Metric[]>(`/metrics/${dbId}`),
  createMetric: (data: MetricCreate) =>
    api.post<Metric, MetricCreate>('/metrics/', data),
  updateMetric: (metricId: number, data: MetricUpdate) =>
    api.put<Metric, MetricUpdate>(`/metrics/${metricId}`, data),
  deleteMetric: (metricId: number) =>
    api.delete<Metric>(`/metrics/${metricId}`),
  generateSimulatedMetrics: (dbId: number, numMetrics: number = 10) =>
    api.post<Metric[], {}> (`/metrics/generate_simulated/${dbId}?num_metrics=${numMetrics}`, {}),
};