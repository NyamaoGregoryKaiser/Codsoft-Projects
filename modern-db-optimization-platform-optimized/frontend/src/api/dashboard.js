import apiClient from './apiClient';

export const getDashboardSummary = async () => {
  const response = await apiClient.get('/dashboard/summary');
  return response.data.data;
};

export const getConnectionMetrics = async (dbConnectionId, period = '24h') => {
  const response = await apiClient.get(`/dashboard/${dbConnectionId}/metrics?period=${period}`);
  return response.data.data;
};