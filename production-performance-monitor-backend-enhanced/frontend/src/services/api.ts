```typescript
import axios from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, User, Project, Task } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (e.g., expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !error.config._isRetry) {
      error.config._isRetry = true; // Prevent infinite retry loops
      console.warn('Unauthorized request. Logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);


// --- Auth Endpoints ---
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<User>('/auth/register', data);
  return response.data;
};

// --- User Endpoints ---
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

// --- Project Endpoints ---
export const getMyProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects/my-projects');
  return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: { name: string; description?: string }): Promise<Project> => {
  const response = await api.post<Project>('/projects', project);
  return response.data;
};

export const updateProject = async (id: string, project: Project): Promise<Project> => {
  const response = await api.put<Project>(`/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// --- Task Endpoints ---
export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const response = await api.get<Task[]>(`/tasks/project/${projectId}`);
  return response.data;
};

export const getMyTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>('/tasks/my-tasks');
  return response.data;
};

export const createTask = async (projectId: string, task: any): Promise<Task> => {
  const response = await api.post<Task>(`/tasks/project/${projectId}`, task);
  return response.data;
};

export const updateTask = async (id: string, task: any): Promise<Task> => {
  const response = await api.put<Task>(`/tasks/${id}`, task);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};
```