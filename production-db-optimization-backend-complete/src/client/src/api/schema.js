import axios from './axiosConfig';

export const getTables = async (connectionId) => {
  const response = await axios.get(`/schema/${connectionId}/tables`);
  return response.data;
};

export const getTableDetails = async (connectionId, schemaName, tableName) => {
  const response = await axios.get(`/schema/${connectionId}/tables/${schemaName}/${tableName}`);
  return response.data;
};