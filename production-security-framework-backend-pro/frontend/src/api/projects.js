```javascript
import apiClient from './auth'; // Use the configured apiClient with interceptors

export const getProjects = async () => {
  const response = await apiClient.get('/projects/');
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await apiClient.post('/projects/', projectData);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await apiClient.put(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

export const getTasksByProject = async (projectId) => {
  const response = await apiClient.get(`/tasks/by-project/${projectId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await apiClient.post('/tasks/', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await apiClient.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await apiClient.delete(`/tasks/${taskId}`);
  return response.data;
};
```