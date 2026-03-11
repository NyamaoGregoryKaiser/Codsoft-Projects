import axiosInstance from './axiosInstance';
import { User } from '../types';

interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export const loginApi = (username: string, password: string) => {
  return axiosInstance.post<LoginResponse>('/auth/signin', { username, password });
};

export const registerApi = (username: string, email: string, password: string) => {
  return axiosInstance.post<{ message: string }>('/auth/signup', { username, email, password, role: ['user'] });
};