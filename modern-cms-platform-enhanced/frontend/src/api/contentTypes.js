```javascript
import api from './axios';

export const getContentTypes = async (params = {}) => {
  const response = await api.get('/content-types', { params });
  return response.data;
};

export const getContentType = async (contentTypeId) => {
  const response = await api.get(`/content-types/${contentTypeId}`);
  return response.data;
};

export const createContentType = async (contentTypeData) => {
  const response = await api.post('/content-types', contentTypeData);
  return response.data;
};

export const updateContentType = async (contentTypeId, contentTypeData) => {
  const response = await api.patch(`/content-types/${contentTypeId}`, contentTypeData);
  return response.data;
};

export const deleteContentType = async (contentTypeId) => {
  const response = await api.delete(`/content-types/${contentTypeId}`);
  return response.data;
};
```