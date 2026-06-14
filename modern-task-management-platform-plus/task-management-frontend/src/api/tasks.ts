```typescript
import axiosInstance from './axiosInstance';
import { Task, TaskDTO } from '../types/task';
import { AxiosResponse } from 'axios';

export const getTasks = async (filters?: { assigneeId?: string; projectId?: string; status?: string }): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
  if (filters?.projectId) params.append('projectId', filters.projectId);
  if (filters?.status) params.append('status', filters.status);

  const response: AxiosResponse<Task[]> = await axiosInstance.get(`/tasks?${params.toString()}`);
  return response.data;
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response: AxiosResponse<Task> = await axiosInstance.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (task: Omit<TaskDTO, 'id'>): Promise<Task> => {
  const response: AxiosResponse<Task> = await axiosInstance.post('/tasks', task);
  return response.data;
};

export const updateTask = async (id: string, task: Partial<TaskDTO>): Promise<Task> => {
  const response: AxiosResponse<Task> = await axiosInstance.put(`/tasks/${id}`, task);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/tasks/${id}`);
};
```