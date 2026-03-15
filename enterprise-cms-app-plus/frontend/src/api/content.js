```javascript
import api from './axiosInstance';

const CONTENT_BASE_URL = '/api/v1';

export const getCategories = (params) => api.get(`${CONTENT_BASE_URL}/categories/`, { params });
export const getCategory = (slug) => api.get(`${CONTENT_BASE_URL}/categories/${slug}/`);
export const createCategory = (data) => api.post(`${CONTENT_BASE_URL}/categories/`, data);
export const updateCategory = (slug, data) => api.patch(`${CONTENT_BASE_URL}/categories/${slug}/`, data);
export const deleteCategory = (slug) => api.delete(`${CONTENT_BASE_URL}/categories/${slug}/`);

export const getTags = (params) => api.get(`${CONTENT_BASE_URL}/tags/`, { params });
export const getTag = (slug) => api.get(`${CONTENT_BASE_URL}/tags/${slug}/`);
export const createTag = (data) => api.post(`${CONTENT_BASE_URL}/tags/`, data);
export const updateTag = (slug, data) => api.patch(`${CONTENT_BASE_URL}/tags/${slug}/`, data);
export const deleteTag = (slug) => api.delete(`${CONTENT_BASE_URL}/tags/${slug}/`);

export const getPosts = (params) => api.get(`${CONTENT_BASE_URL}/posts/`, { params });
export const getPost = (slug) => api.get(`${CONTENT_BASE_URL}/posts/${slug}/`);
export const createPost = (data) => api.post(`${CONTENT_BASE_URL}/posts/`, data);
export const updatePost = (slug, data) => api.patch(`${CONTENT_BASE_URL}/posts/${slug}/`, data);
export const deletePost = (slug) => api.delete(`${CONTENT_BASE_URL}/posts/${slug}/`);
export const publishPost = (slug) => api.post(`${CONTENT_BASE_URL}/posts/${slug}/publish/`);

export const getPages = (params) => api.get(`${CONTENT_BASE_URL}/pages/`, { params });
export const getPage = (slug) => api.get(`${CONTENT_BASE_URL}/pages/${slug}/`);
export const createPage = (data) => api.post(`${CONTENT_BASE_URL}/pages/`, data);
export const updatePage = (slug, data) => api.patch(`${CONTENT_BASE_URL}/pages/${slug}/`, data);
export const deletePage = (slug) => api.delete(`${CONTENT_BASE_URL}/pages/${slug}/`);

export const getMediaItems = (params) => api.get(`${CONTENT_BASE_URL}/media/`, { params });
export const uploadMediaItem = (formData) => api.post(`${CONTENT_BASE_URL}/media/`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const updateMediaItem = (id, data) => api.patch(`${CONTENT_BASE_URL}/media/${id}/`, data);
export const deleteMediaItem = (id) => api.delete(`${CONTENT_BASE_URL}/media/${id}/`);
```