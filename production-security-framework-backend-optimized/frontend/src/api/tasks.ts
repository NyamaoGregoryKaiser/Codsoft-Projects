```typescript
import api from './auth'; // Use the configured axios instance
import { Task, CreateTaskData, UpdateTaskData } from '../types';

export const tasks = {
  getTasks: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
```