import { api } from './index';
import { User, UserCreate, UserUpdate } from '@types';

export const usersApi = {
  getUsers: () =>
    api.get<User[]>('/users'),
  getUserById: (userId: number) =>
    api.get<User>(`/users/${userId}`),
  createUser: (data: UserCreate) =>
    api.post<User, UserCreate>('/users/', data),
  updateUser: (userId: number, data: UserUpdate) =>
    api.put<User, UserUpdate>(`/users/${userId}`, data),
  deleteUser: (userId: number) =>
    api.delete<User>(`/users/${userId}`),
};