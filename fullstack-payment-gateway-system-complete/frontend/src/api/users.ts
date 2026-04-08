import api from './axios';
import { User } from '@/types/user';
import { CreateUserDto, UpdateUserDto } from '@/types/auth'; // Re-use auth DTOs

export const getUsers = async (merchantId?: string): Promise<User[]> => {
  const params = merchantId ? { merchantId } : {};
  const response = await api.get<User[]>('/users', { params });
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: CreateUserDto): Promise<User> => {
  const response = await api.post<User>('/users', data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
  const response = await api.patch<User>(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};