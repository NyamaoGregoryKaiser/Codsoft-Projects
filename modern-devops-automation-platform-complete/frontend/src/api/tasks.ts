```typescript
import axiosInstance from './axiosInstance';
import { Task, UpdateTaskData } from '@/utils/types';

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await axiosInstance.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  const response = await axiosInstance.put<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(`/tasks/${id}`);
  return response.data;
};
```