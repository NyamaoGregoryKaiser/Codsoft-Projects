```typescript
import axiosInstance from './axiosInstance';
import { Project, PaginatedResponse, ApiResponse } from 'types';

interface CreateProjectPayload {
  name: string;
  description?: string;
}

interface UpdateProjectPayload {
  name?: string;
  description?: string;
}

export const createProject = async (payload: CreateProjectPayload): Promise<ApiResponse<Project>> => {
  const response = await axiosInstance.post<ApiResponse<Project>>('/projects', payload);
  return response.data;
};

export const getProjects = async (page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Project>>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<Project>>>(`/projects?page=${page}&limit=${limit}`);
  return response.data;
};

export const getProjectById = async (id: string): Promise<ApiResponse<Project>> => {
  const response = await axiosInstance.get<ApiResponse<Project>>(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (id: string, payload: UpdateProjectPayload): Promise<ApiResponse<Project>> => {
  const response = await axiosInstance.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
  return response.data;
};

export const deleteProject = async (id: string): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/projects/${id}`);
  return response.data;
};
```