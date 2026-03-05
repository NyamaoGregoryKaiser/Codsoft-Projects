import axios from './axiosConfig';

export const getLiveMetrics = async (connectionId) => {
  const response = await axios.get(`/metrics/${connectionId}/live`);
  return response.data;
};

export const getMetricsHistory = async (connectionId, timeRange = '24h') => {
  const response = await axios.get(`/metrics/${connectionId}/history?timeRange=${timeRange}`);
  return response.data;
};

export const recordMetrics = async (connectionId) => {
  const response = await axios.post(`/metrics/${connectionId}/record`);
  return response.data;
};