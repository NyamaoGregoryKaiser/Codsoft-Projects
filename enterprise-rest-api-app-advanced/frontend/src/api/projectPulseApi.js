import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

const projectPulseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
projectPulseApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
projectPulseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized access. Redirecting to login.');
      // Optionally clear token and redirect to login
      localStorage.removeItem('jwtToken');
      // window.location.href = '/login'; // Or use navigate from react-router-dom if outside component
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const login = (credentials) => projectPulseApi.post('/auth/login', credentials);
export const register = (userData) => projectPulseApi.post('/auth/register', userData);
export const getCurrentUser = () => projectPulseApi.get('/users/me');

// --- Project Endpoints ---
export const getAllProjects = () => projectPulseApi.get('/projects');
export const getProjectById = (id) => projectPulseApi.get(`/projects/${id}`);
export const createProject = (projectData) => projectPulseApi.post('/projects', projectData);
export const updateProject = (id, projectData) => projectPulseApi.put(`/projects/${id}`, projectData);
export const deleteProject = (id) => projectPulseApi.delete(`/projects/${id}`);

// --- Task Endpoints ---
export const getTasksByProjectId = (projectId) => projectPulseApi.get(`/tasks/project/${projectId}`);
export const getTaskById = (taskId) => projectPulseApi.get(`/tasks/${taskId}`);
export const createTask = (taskData) => projectPulseApi.post('/tasks', taskData);
export const updateTask = (id, taskData) => projectPulseApi.put(`/tasks/${id}`, taskData);
export const deleteTask = (id) => projectPulseApi.delete(`/tasks/${id}`);

export default projectPulseApi;
```

**Authentication Context/Hooks**
**`frontend/src/auth/AuthContext.js`**
```javascript