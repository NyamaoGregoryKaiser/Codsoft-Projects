```javascript
import api from './axios';

export const getTasks = (projectId) => api.get(`/tasks?projectId=${projectId}`);
export const getTaskById = (taskId) => api.get(`/tasks/${taskId}`);
export const createTask = (taskData) => api.post('/tasks', taskData);
export const updateTask = (taskId, taskData) => api.patch(`/tasks/${taskId}`, taskData);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
```