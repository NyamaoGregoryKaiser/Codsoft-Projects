```typescript
import axios from 'api/axios';
import { User } from 'types';

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface RegisterResponse {
  message: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (username: string, email: string, password: string): Promise<RegisterResponse> => {
  try {
    const response = await axios.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const getMyProfile = async (): Promise<User> => {
  try {
    const response = await axios.get('/users/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

export const updateMyProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await axios.put('/users/me', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};
```