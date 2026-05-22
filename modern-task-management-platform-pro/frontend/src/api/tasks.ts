```typescript
import axiosInstance from './axiosInstance';
import { Task, PaginatedResponse, TaskStatus, TaskPriority, ApiResponse } from 'types';

interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // ISO date string
  assigneeId?: string;
}

interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null; // ISO date string
  assigneeId?: string | null;
}

export const createTask = async (projectId: string, payload: CreateTaskPayload): Promise<ApiResponse<Task>> => {
  const response = await axiosInstance.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, payload);
  return response.data;
};

export const getTasksByProject = async (projectId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Task>>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Task>>>(`/projects/${projectId}/tasks?page=${page}&limit=${limit}`);
  return response.data;
};

export const getTaskById = async (taskId: string): Promise<ApiResponse<Task>> => {
  const response = await axiosInstance.get<ApiResponse<Task>>(`/projects/any/tasks/${taskId}`); // The projectId param in backend route is merged
  return response.data;
};

export const updateTask = async (taskId: string, payload: UpdateTaskPayload): Promise<ApiResponse<Task>> => {
  const response = await axiosInstance.patch<ApiResponse<Task>>(`/projects/any/tasks/${taskId}`, payload);
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/projects/any/tasks/${taskId}`);
  return response.data;
};
```