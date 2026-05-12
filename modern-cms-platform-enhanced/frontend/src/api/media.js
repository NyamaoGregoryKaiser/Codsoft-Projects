```javascript
import api from './axios';

export const getMediaItems = async (params = {}) => {
  const response = await api.get('/media', { params });
  return response.data;
};

export const getMedia = async (mediaId) => {
  const response = await api.get(`/media/${mediaId}`);
  return response.data;
};

export const createMedia = async (mediaData) => {
  // In a real app, `mediaData` would likely be a FormData object
  // for file uploads, and content-type would be multipart/form-data.
  // For this simplified example, we're sending JSON with a simulated URL.
  const response = await api.post('/media', mediaData);
  return response.data;
};

export const updateMedia = async (mediaId, mediaData) => {
  const response = await api.patch(`/media/${mediaId}`, mediaData);
  return response.data;
};

export const deleteMedia = async (mediaId) => {
  const response = await api.delete(`/media/${mediaId}`);
  return response.data;
};
```