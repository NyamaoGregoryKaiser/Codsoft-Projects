import apiClient from './apiClient';

export const createDbConnection = async (connectionData) => {
  const response = await apiClient.post('/databases', connectionData);
  return response.data.data;
};

export const getAllDbConnections = async () => {
  const response = await apiClient.get('/databases');
  return response.data.data;
};

export const getDbConnectionById = async (id) => {
  const response = await apiClient.get(`/databases/${id}`);
  return response.data.data;
};

export const updateDbConnection = async (id, connectionData) => {
  const response = await apiClient.put(`/databases/${id}`, connectionData);
  return response.data.data;
};

export const deleteDbConnection = async (id) => {
  const response = await apiClient.delete(`/databases/${id}`);
  return response.data.message;
};

export const startMonitoring = async (id) => {
  const response = await apiClient.post(`/databases/${id}/monitor/start`);
  return response.data.data;
};

export const stopMonitoring = async (id) => {
  const response = await apiClient.post(`/databases/${id}/monitor/stop`);
  return response.data.data;
};