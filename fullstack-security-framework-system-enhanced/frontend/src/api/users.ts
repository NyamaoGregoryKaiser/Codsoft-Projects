import apiClient from './axios';
import { User, UserUpdateData } from 'types/auth';

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/users');
  return response.data.data.users;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data;
};

export const updateUser = async (id: string, data: UserUpdateData): Promise<User> => {
  const response = await apiClient.patch(`/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/users/change-password', { oldPassword, newPassword });
};

// Assuming the backend has a /users/me endpoint to get the current user's profile
export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data.data;
};