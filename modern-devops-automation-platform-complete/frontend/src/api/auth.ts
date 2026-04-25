```typescript
import axiosInstance from './axiosInstance';
import { User, LoginData, RegisterData } from '@/utils/types';

export interface AuthResponse {
  token: string;
  user: Omit<User, 'projects' | 'tasks'>;
  message?: string;
}

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/users/profile');
  return response.data;
};
```