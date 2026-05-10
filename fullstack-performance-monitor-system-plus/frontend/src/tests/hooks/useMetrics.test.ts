import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectSummary, useMetricsTimeline, useRecentErrors } from '../../hooks/useMetrics';
import apiClient from '../../api/api-client';
import { ToastProvider } from '../../contexts/ToastContext';
import React from 'react';
import { MetricType, MetricPeriod } from '../../types';

// Mock the API client
jest.mock('../../api/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>{children}</ToastProvider>
  </QueryClientProvider>
);

describe('Metrics Hooks', () => {
  const projectId = 'test-project-id';
  const mockDate = new Date().toISOString();

  beforeEach(() => {
    queryClient.clear(); // Clear cache between tests
    mockedApiClient.get.mockReset();
  });

  describe('useProjectSummary', () => {
    it('fetches project summary successfully', async () => {
      const mockSummary = {
        LCP: { avg: 1500, min: 1000, max: 2000, count: 2 },
        FID: { avg: 50, min: 40, max: 60, count: 3 },
        CLS: { avg: 0.1, min: 0.05, max: 0.15, count: 4 },
        totalErrors: 5,
      };
      const period: MetricPeriod = '1d';
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: mockSummary } });

      const { result } = renderHook(() => useProjectSummary(projectId, period), { wrapper });

      expect(result.current.isLoadingSummary).toBe(true);

      await waitFor(() => expect(result.current.isLoadingSummary).toBe(false));

      expect(result.current.summary).toEqual(mockSummary);
      expect(result.current.isErrorSummary).toBe(false);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/metrics/${projectId}/summary?period=${period}`);
    });

    it('handles error when fetching project summary', async () => {
      const errorMessage = 'Failed to load summary';
      const period: MetricPeriod = '1d';
      mockedApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProjectSummary(projectId, period), { wrapper });

      await waitFor(() => expect(result.current.isLoadingSummary).toBe(false));

      expect(result.current.summary).toBeUndefined();
      expect(result.current.isErrorSummary).toBe(true);
      expect(result.current.errorSummary?.message).toBe(errorMessage);
    });
  });

  describe('useMetricsTimeline', () => {
    it('fetches metrics timeline successfully', async () => {
      const mockTimeline = [
        { timestamp: mockDate, value: 1200 },
        { timestamp: mockDate, value: 1500 },
      ];
      const metricType: MetricType = 'LCP';
      const period: MetricPeriod = '1d';
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: mockTimeline } });

      const { result } = renderHook(() => useMetricsTimeline(projectId, metricType, period), { wrapper });

      expect(result.current.isLoadingTimeline).toBe(true);

      await waitFor(() => expect(result.current.isLoadingTimeline).toBe(false));

      expect(result.current.timelineData).toEqual(mockTimeline);
      expect(result.current.isErrorTimeline).toBe(false);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/metrics/${projectId}/timeline?metricType=${metricType}&period=${period}`);
    });

    it('handles error when fetching metrics timeline', async () => {
      const errorMessage = 'Failed to load timeline';
      const metricType: MetricType = 'LCP';
      const period: MetricPeriod = '1d';
      mockedApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useMetricsTimeline(projectId, metricType, period), { wrapper });

      await waitFor(() => expect(result.current.isLoadingTimeline).toBe(false));

      expect(result.current.timelineData).toBeUndefined();
      expect(result.current.isErrorTimeline).toBe(true);
      expect(result.current.errorTimeline?.message).toBe(errorMessage);
    });
  });

  describe('useRecentErrors', () => {
    it('fetches recent errors successfully', async () => {
      const mockErrors = [
        { id: 'e1', timestamp: mockDate, context: { message: 'JS Error', url: '/home' } },
        { id: 'e2', timestamp: mockDate, context: { message: 'API Error', url: '/api/data' } },
      ];
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: mockErrors } });

      const { result } = renderHook(() => useRecentErrors(projectId), { wrapper });

      expect(result.current.isLoadingRecentErrors).toBe(true);

      await waitFor(() => expect(result.current.isLoadingRecentErrors).toBe(false));

      expect(result.current.recentErrors).toEqual(mockErrors);
      expect(result.current.isErrorRecentErrors).toBe(false);
      expect(mockedApiClient.get).toHaveBeenCalledWith(`/metrics/${projectId}/errors`);
    });

    it('handles error when fetching recent errors', async () => {
      const errorMessage = 'Failed to load errors';
      mockedApiClient.get.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useRecentErrors(projectId), { wrapper });

      await waitFor(() => expect(result.current.isLoadingRecentErrors).toBe(false));

      expect(result.current.recentErrors).toBeUndefined();
      expect(result.current.isErrorRecentErrors).toBe(true);
      expect(result.current.errorRecentErrors?.message).toBe(errorMessage);
    });
  });
});
```

```