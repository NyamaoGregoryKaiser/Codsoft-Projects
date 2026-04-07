```javascript
import api from './api';

export const getModels = async () => {
  try {
    const response = await api.get('/models');
    return response.data.data.models;
  } catch (error) {
    throw error;
  }
};

export const getModelById = async (id) => {
  try {
    const response = await api.get(`/models/${id}`);
    return response.data.data.model;
  } catch (error) {
    throw error;
  }
};

export const createModel = async (modelData) => {
  try {
    const response = await api.post('/models', modelData);
    return response.data.data.model;
  } catch (error) {
    throw error;
  }
};

export const updateModel = async (id, modelData) => {
  try {
    const response = await api.patch(`/models/${id}`, modelData);
    return response.data.data.model;
  } catch (error) {
    throw error;
  }
};

export const deleteModel = async (id) => {
  try {
    await api.delete(`/models/${id}`);
    return { message: 'Model deleted successfully.' };
  } catch (error) {
    throw error;
  }
};

export const runInference = async (id, payload) => {
  try {
    const response = await api.post(`/models/${id}/infer`, payload);
    return response.data.data.inference_result;
  } catch (error) {
    throw error;
  }
};
```