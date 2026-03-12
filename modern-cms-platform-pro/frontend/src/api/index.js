import axios from 'axios';
import { API_BASE_URL } from '../config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Interceptor for refreshing tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error status is 401 and not a login/refresh request itself
    if (error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/token')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', response.data.access);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          return axiosInstance(originalRequest); // Retry the original request
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // Handle refresh token failure (e.g., redirect to login)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login'; // Or emit an event to the AuthContext
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

const API = {
  auth: {
    login: (credentials) => axiosInstance.post('/auth/login/', credentials),
    register: (data) => axiosInstance.post('/auth/register/', data),
    logout: (refreshToken) => axiosInstance.post('/auth/logout/', { refresh: refreshToken }),
    getProfile: () => axiosInstance.get('/auth/me/'),
  },
  posts: {
    list: (params) => axiosInstance.get('/posts/', { params }),
    retrieve: (slug) => axiosInstance.get(`/posts/${slug}/`),
    create: (data) => axiosInstance.post('/posts/', data),
    update: (slug, data) => axiosInstance.put(`/posts/${slug}/`, data),
    partialUpdate: (slug, data) => axiosInstance.patch(`/posts/${slug}/`, data),
    delete: (slug) => axiosInstance.delete(`/posts/${slug}/`),
    publish: (slug) => axiosInstance.post(`/posts/${slug}/publish/`),
    draft: (slug) => axiosInstance.post(`/posts/${slug}/draft/`),
  },
  pages: {
    list: (params) => axiosInstance.get('/pages/', { params }),
    retrieve: (slug) => axiosInstance.get(`/pages/${slug}/`),
    create: (data) => axiosInstance.post('/pages/', data),
    update: (slug, data) => axiosInstance.put(`/pages/${slug}/`, data),
    partialUpdate: (slug, data) => axiosInstance.patch(`/pages/${slug}/`, data),
    delete: (slug) => axiosInstance.delete(`/pages/${slug}/`),
    publish: (slug) => axiosInstance.post(`/pages/${slug}/publish/`),
    draft: (slug) => axiosInstance.post(`/pages/${slug}/draft/`),
  },
  categories: {
    list: () => axiosInstance.get('/categories/'),
    retrieve: (slug) => axiosInstance.get(`/categories/${slug}/`),
    create: (data) => axiosInstance.post('/categories/', data),
    update: (slug, data) => axiosInstance.put(`/categories/${slug}/`, data),
    delete: (slug) => axiosInstance.delete(`/categories/${slug}/`),
  },
  tags: {
    list: () => axiosInstance.get('/tags/'),
    retrieve: (slug) => axiosInstance.get(`/tags/${slug}/`),
    create: (data) => axiosInstance.post('/tags/', data),
    update: (slug, data) => axiosInstance.put(`/tags/${slug}/`, data),
    delete: (slug) => axiosInstance.delete(`/tags/${slug}/`),
  },
  media: {
    list: (params) => axiosInstance.get('/media/', { params }),
    upload: (formData) => axiosInstance.post('/media/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    retrieve: (id) => axiosInstance.get(`/media/${id}/`),
    delete: (id) => axiosInstance.delete(`/media/${id}/`),
  },
  revisions: {
    list: (params) => axiosInstance.get('/revisions/', {params}),
    retrieve: (id) => axiosInstance.get(`/revisions/${id}/`),
    restore: (id) => axiosInstance.post(`/revisions/${id}/restore/`),
  }
};

export default API;
```

#### `frontend/src/context/AuthContext.js`

```javascript