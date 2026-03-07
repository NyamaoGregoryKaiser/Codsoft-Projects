```javascript
import api from './axios';

export const getProjects = () => api.get('/projects');
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (projectData) => api.post('/projects', projectData);
export const updateProject = (id, projectData) => api.patch(`/projects/${id}`, projectData);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addProjectMember = (projectId, userId) => api.post(`/projects/${projectId}/members`, { userId });
export const removeProjectMember = (projectId, userId) => api.delete(`/projects/${projectId}/members`, { data: { userId } });
```