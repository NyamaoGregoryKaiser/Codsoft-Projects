```typescript
import axiosInstance from './axiosInstance';
import { User, ApiResponse } from 'types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

export const login = async (payload: LoginPayload): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.post<ApiResponse<User>>('/auth/login', payload);
  return response.data;
};

export const register = async (payload: RegisterPayload): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.post<ApiResponse<User>>('/auth/register', payload);
  return response.data;
};

export const logout = async (): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.get<ApiResponse<null>>('/auth/logout');
  return response.data;
};

export const getMe = async (): Promise<ApiResponse<User>> => {
  const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
  return response.data;
};
```