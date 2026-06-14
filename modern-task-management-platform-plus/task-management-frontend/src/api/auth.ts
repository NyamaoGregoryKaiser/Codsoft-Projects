```typescript
import axiosInstance from './axiosInstance';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth'; // Define these types

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};
```