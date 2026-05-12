```javascript
import api from './axios';

export const getEntries = async (contentTypeId, params = {}) => {
  const response = await api.get(`/content-types/${contentTypeId}/entries`, { params });
  return response.data;
};

export const getEntry = async (contentTypeId, entryId) => {
  const response = await api.get(`/content-types/${contentTypeId}/entries/${entryId}`);
  return response.data;
};

export const createEntry = async (contentTypeId, entryData) => {
  const response = await api.post(`/content-types/${contentTypeId}/entries`, entryData);
  return response.data;
};

export const updateEntry = async (contentTypeId, entryId, entryData) => {
  const response = await api.patch(`/content-types/${contentTypeId}/entries/${entryId}`, entryData);
  return response.data;
};

export const deleteEntry = async (contentTypeId, entryId) => {
  const response = await api.delete(`/content-types/${contentTypeId}/entries/${entryId}`);
  return response.data;
};
```