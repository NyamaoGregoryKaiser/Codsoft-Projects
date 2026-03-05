import axios from './axiosConfig';

export const createConnection = async (connectionData) => {
  const response = await axios.post('/connections', connectionData);
  return response.data;
};

export const getConnections = async () => {
  const response = await axios.get('/connections');
  return response.data;
};

export const getConnectionById = async (id) => {
  const response = await axios.get(`/connections/${id}`);
  return response.data;
};

export const updateConnection = async (id, connectionData) => {
  const response = await axios.put(`/connections/${id}`, connectionData);
  return response.data;
};

export const deleteConnection = async (id) => {
  const response = await axios.delete(`/connections/${id}`);
  return response.data;
};

export const testConnection = async (id) => {
  const response = await axios.get(`/connections/${id}/test`);
  return response.data;
};