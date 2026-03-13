```typescript
import api from './axios';
import { User, UserRole } from '@types-frontend/entities';
import { LoginPayload, RegisterPayload, AuthResponse } from '@types-frontend/auth';

export const registerUser = async (userData: RegisterPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const updateUserRole = async (id: string, role: UserRole): Promise<{ message: string; user: User }> => {
  const response = await api.patch<{ message: string; user: User }>(`/users/${id}/role`, { role });
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete<void>(`/users/${id}`);
};
```