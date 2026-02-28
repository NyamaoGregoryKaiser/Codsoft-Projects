```jsx
import api from './index';

export const getPublishedContent = async (page = 0, size = 10, sortBy = 'publishedAt') => {
  const response = await api.get('/content/public', {
    params: { page, size, sortBy },
  });
  return response.data;
};

export const getAllContent = async (page = 0, size = 10, sortBy = 'createdAt') => {
  const response = await api.get('/content', {
    params: { page, size, sortBy },
  });
  return response.data;
};

export const getContentById = async (id) => {
  const response = await api.get(`/content/${id}`);
  return response.data;
};

export const createContent = async (contentData) => {
  const response = await api.post('/content', contentData);
  return response.data;
};

export const updateContent = async (id, contentData) => {
  const response = await api.put(`/content/${id}`, contentData);
  return response.data;
};

export const deleteContent = async (id) => {
  const response = await api.delete(`/content/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getMedia = async () => {
  const response = await api.get('/media');
  return response.data;
};

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
```