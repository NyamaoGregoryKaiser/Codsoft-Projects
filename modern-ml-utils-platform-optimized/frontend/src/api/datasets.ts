import api from './axios';

export const createDataset = async (datasetData: any) => {
  const response = await api.post('/datasets', datasetData);
  return response.data;
};

export const fetchDatasets = async () => {
  const response = await api.get('/datasets');
  return response.data;
};

export const fetchDatasetById = async (id: string) => {
  const response = await api.get(`/datasets/${id}`);
  return response.data;
};

export const updateDataset = async (id: string, updateData: any) => {
  const response = await api.patch(`/datasets/${id}`, updateData);
  return response.data;
};

export const deleteDataset = async (id: string) => {
  const response = await api.delete(`/datasets/${id}`);
  return response.data;
};