import axios from './axiosConfig';
import { Application, PerformanceMetric, MetricTrendData, BreakdownData } from '../types';

export interface ApplicationOverview {
  totalMetrics: number;
  avgLCP: number | null;
  avgFCP: number | null;
  pageCount: number;
  periodDays: number;
}

export interface PageMetricsReport {
  metrics: PerformanceMetric[];
  browserBreakdown: BreakdownData[];
  deviceBreakdown: BreakdownData[];
}

export const getApplicationOverview = async (appId: string, periodDays: number = 7): Promise<ApplicationOverview> => {
  const response = await axios.get(`/reports/${appId}/overview`, { params: { periodDays } });
  return response.data;
};

export const getPageMetrics = async (appId: string, pageId: string, metricType: string, periodDays: number = 7): Promise<PageMetricsReport> => {
  const response = await axios.get(`/reports/${appId}/pages/${pageId}/metrics`, { params: { metricType, periodDays } });
  return response.data;
};

export const getMetricTrends = async (appId: string, metricType: string, pageId?: string, periodDays: number = 30): Promise<MetricTrendData[]> => {
  const response = await axios.get(`/reports/${appId}/trends/${metricType}`, { params: { pageId, periodDays } });
  return response.data;
};