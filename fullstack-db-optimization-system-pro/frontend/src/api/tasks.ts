import { api } from './index';
import { Task, TaskCreate, TaskUpdate } from '@types';

export const tasksApi = {
  getTasks: () =>
    api.get<Task[]>('/tasks'),
  getTaskById: (taskId: number) =>
    api.get<Task>(`/tasks/${taskId}`),
  createTask: (data: TaskCreate) =>
    api.post<Task, TaskCreate>('/tasks/', data),
  updateTask: (taskId: number, data: TaskUpdate) =>
    api.put<Task, TaskUpdate>(`/tasks/${taskId}`, data),
  deleteTask: (taskId: number) =>
    api.delete<Task>(`/tasks/${taskId}`),
};