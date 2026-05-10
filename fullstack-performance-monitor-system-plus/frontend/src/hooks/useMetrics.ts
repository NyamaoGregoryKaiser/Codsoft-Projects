import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/api-client';
import { MetricDataPoint, MetricPeriod, MetricType, ProjectSummaryMetrics, ErrorMetric } from '../types';
import { useToast } from '../contexts/ToastContext';

// --- API Calls ---
const fetchProjectSummary = async (projectId: string, period: MetricPeriod): Promise<ProjectSummaryMetrics> => {
  const response = await apiClient.get(`/metrics/${projectId}/summary?period=${period}`);
  return response.data.data;
};

const fetchMetricsTimeline = async (projectId: string, metricType: MetricType, period: MetricPeriod): Promise<MetricDataPoint[]> => {
  const response = await apiClient.get(`/metrics/${projectId}/timeline?metricType=${metricType}&period=${period}`);
  return response.data.data;
};

const fetchRecentErrors = async (projectId: string): Promise<ErrorMetric[]> => {
  const response = await apiClient.get(`/metrics/${projectId}/errors`);
  return response.data.data;
};

// --- Hooks ---
export const useProjectSummary = (projectId: string, period: MetricPeriod = '1d') => {
  const { addToast } = useToast();
  const { data, isLoading, isError, error } = useQuery<ProjectSummaryMetrics, Error>({
    queryKey: ['metricsSummary', projectId, period],
    queryFn: () => fetchProjectSummary(projectId, period),
    enabled: !!projectId,
    onError: (err) => {
      addToast(`Error fetching project summary: ${err.message}`, 'error');
    },
  });

  return {
    summary: data,
    isLoadingSummary: isLoading,
    isErrorSummary: isError,
    errorSummary: error,
  };
};

export const useMetricsTimeline = (projectId: string, metricType: MetricType, period: MetricPeriod = '1d') => {
  const { addToast } = useToast();
  const { data, isLoading, isError, error } = useQuery<MetricDataPoint[], Error>({
    queryKey: ['metricsTimeline', projectId, metricType, period],
    queryFn: () => fetchMetricsTimeline(projectId, metricType, period),
    enabled: !!projectId && !!metricType,
    onError: (err) => {
      addToast(`Error fetching metric timeline for ${metricType}: ${err.message}`, 'error');
    },
  });

  return {
    timelineData: data,
    isLoadingTimeline: isLoading,
    isErrorTimeline: isError,
    errorTimeline: error,
  };
};

export const useRecentErrors = (projectId: string) => {
  const { addToast } = useToast();
  const { data, isLoading, isError, error } = useQuery<ErrorMetric[], Error>({
    queryKey: ['recentErrors', projectId],
    queryFn: () => fetchRecentErrors(projectId),
    enabled: !!projectId,
    onError: (err) => {
      addToast(`Error fetching recent errors: ${err.message}`, 'error');
    },
  });

  return {
    recentErrors: data,
    isLoadingRecentErrors: isLoading,
    isErrorRecentErrors: isError,
    errorRecentErrors: error,
  };
};
```

```