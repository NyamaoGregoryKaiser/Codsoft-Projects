import axios from 'axios';
import { AuthResponse, User, Project, Task, Comment } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check for 401 Unauthorized and if it's not a login/register/refresh request
    if (error.response?.status === 401 && !originalRequest._retry &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/register') &&
        !originalRequest.url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, force logout
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await api.post<Pick<AuthResponse, 'accessToken'>>('/auth/refresh-token', { refreshToken });
        const newAccessToken = response.data.accessToken;

        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest); // Retry the original request with the new token
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Refresh token failed, force logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


// --- Auth API ---
export const authApi = {
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  login: (data: any) => api.post<AuthResponse>('/auth/login', data),
  refreshToken: (token: string) => api.post<Pick<AuthResponse, 'accessToken'>>('/auth/refresh-token', { refreshToken: token }),
};

// --- User API ---
export const userApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
  getAllUsers: () => api.get<User[]>('/users'), // Admin only
};

// --- Project API ---
export const projectApi = {
  createProject: (data: Partial<Project>) => api.post<Project>('/projects', data),
  getAllProjects: () => api.get<Project[]>('/projects'),
  getProjectById: (id: string) => api.get<Project>(`/projects/${id}`),
  updateProject: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};

// --- Task API ---
export const taskApi = {
  createTask: (data: Partial<Task>) => api.post<Task>('/tasks', data),
  getTasksByProjectId: (projectId: string) => api.get<Task[]>(`/tasks/project/${projectId}`),
  getTaskById: (id: string) => api.get<Task>(`/tasks/${id}`),
  updateTask: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

// --- Comment API ---
export const commentApi = {
  createComment: (data: Partial<Comment>) => api.post<Comment>('/comments', data),
  getCommentsByTaskId: (taskId: string) => api.get<Comment[]>(`/comments/task/${taskId}`),
  updateComment: (id: string, data: Partial<Comment>) => api.put<Comment>(`/comments/${id}`, data),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

export default api;