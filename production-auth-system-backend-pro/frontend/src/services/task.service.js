```javascript
import api from './api';

const TASK_URL = '/tasks';

const getTasks = async () => {
  try {
    const response = await api.get(TASK_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const getTaskById = async (id) => {
  try {
    const response = await api.get(`${TASK_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const createTask = async (taskData) => {
  try {
    const response = await api.post(TASK_URL, taskData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`${TASK_URL}/${id}`, taskData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const deleteTask = async (id) => {
  try {
    await api.delete(`${TASK_URL}/${id}`);
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

export default taskService;
```