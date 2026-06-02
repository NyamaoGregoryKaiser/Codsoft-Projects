import api from './api';

const TASKS_API_URL = '/tasks';

export const getAllTasks = () => {
  return api.get(TASKS_API_URL);
};

export const getTaskById = (id) => {
  return api.get(`${TASKS_API_URL}/${id}`);
};

export const createTask = (taskData) => {
  return api.post(TASKS_API_URL, taskData);
};

export const updateTask = (id, taskData) => {
  return api.put(`${TASKS_API_URL}/${id}`, taskData);
};

export const deleteTask = (id) => {
  return api.delete(`${TASKS_API_URL}/${id}`);
};