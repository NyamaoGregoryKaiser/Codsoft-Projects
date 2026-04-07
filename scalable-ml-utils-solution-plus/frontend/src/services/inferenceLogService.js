```javascript
import api from './api';

export const getInferenceLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/inference-logs?${params.toString()}`);
    return response.data; // Contains total, page, limit, data
  } catch (error) {
    throw error;
  }
};

export const getInferenceLogById = async (id) => {
  try {
    const response = await api.get(`/inference-logs/${id}`);
    return response.data.data.log;
  } catch (error) {
    throw error;
  }
};
```