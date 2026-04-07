```javascript
import api from './api';

export const getDatasets = async () => {
  try {
    const response = await api.get('/datasets');
    return response.data.data.datasets;
  } catch (error) {
    throw error;
  }
};

export const getDatasetById = async (id) => {
  try {
    const response = await api.get(`/datasets/${id}`);
    return response.data.data.dataset;
  } catch (error) {
    throw error;
  }
};

export const createDataset = async (datasetData) => {
  try {
    const response = await api.post('/datasets', datasetData);
    return response.data.data.dataset;
  } catch (error) {
    throw error;
  }
};

export const updateDataset = async (id, datasetData) => {
  try {
    const response = await api.patch(`/datasets/${id}`, datasetData);
    return response.data.data.dataset;
  } catch (error) {
    throw error;
  }
};

export const deleteDataset = async (id) => {
  try {
    await api.delete(`/datasets/${id}`);
    return { message: 'Dataset deleted successfully.' };
  } catch (error) {
    throw error;
  }
};
```