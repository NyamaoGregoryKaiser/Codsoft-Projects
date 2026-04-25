```typescript
import axiosInstance from './axiosInstance';
import { Project, CreateProjectData, UpdateProjectData, Task, CreateTaskData } from '@/utils/types';

export const getProjects = async (): Promise<Project[]> => {
  const response = await axiosInstance.get<Project[]>('/projects');
  return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await axiosInstance.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: CreateProjectData): Promise<Project> => {
  const response = await axiosInstance.post<Project>('/projects', data);
  return response.data;
};

export const updateProject = async (id: string, data: UpdateProjectData): Promise<Project> => {
  const response = await axiosInstance.put<Project>(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(`/projects/${id}`);
  return response.data;
};

// Tasks within a project
export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const response = await axiosInstance.get<Task[]>(`/projects/${projectId}/tasks`);
  return response.data;
};

export const createTask = async (projectId: string, data: CreateTaskData): Promise<Task> => {
  const response = await axiosInstance.post<Task>(`/projects/${projectId}/tasks`, data);
  return response.data;
};
```