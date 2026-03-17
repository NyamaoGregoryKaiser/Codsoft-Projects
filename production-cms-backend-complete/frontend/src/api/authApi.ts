import axiosInstance from './axiosInstance';
import { User, UserRole, ApiResponse } from '../types';

interface RegisterData {
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponseData {
  user: Pick<User, 'id' | 'email' | 'role'>;
  token: string;
}

export const registerUser = async (data: RegisterData): Promise<ApiResponse<AuthResponseData>> => {
  const response = await axiosInstance.post<ApiResponse<AuthResponseData>>('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<ApiResponse<AuthResponseData>> => {
  const response = await axiosInstance.post<ApiResponse<AuthResponseData>>('/auth/login', data);
  return response.data;
};

export const fetchCurrentUser = async (): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
  return response.data;
};