import axios from 'axios';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/task';

const API_URL = process.env.REACT_APP_API_BASE_URL + '/tasks';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getAuthHeaders = () => {
  if (!authToken) {
    throw new Error('No authentication token found. Please log in.');
  }
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };
};

export const getTasks = async (queryParams?: { status?: string; priority?: string; assigneeId?: string; search?: string; page?: number; limit?: number }): Promise<{ tasks: Task[]; total: number }> => {
  const response = await axios.get(API_URL, {
    ...getAuthHeaders(),
    params: queryParams,
  });
  return response.data;
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
  return response.data;
};

export const createTask = async (taskData: CreateTaskDto): Promise<Task> => {
  const response = await axios.post(API_URL, taskData, getAuthHeaders());
  return response.data;
};

export const updateTask = async (id: string, taskData: UpdateTaskDto): Promise<Task> => {
  const response = await axios.put(`${API_URL}/${id}`, taskData, getAuthHeaders());
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
};