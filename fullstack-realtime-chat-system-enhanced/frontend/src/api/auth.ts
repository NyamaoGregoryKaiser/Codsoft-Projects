```typescript
import axios from './axiosInstance';
import { User, UserCreate, Token } from '../types';

export const login = async (username: string, password: string): Promise<Token> => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post<Token>('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (userData: UserCreate): Promise<User> => {
  const response = await axios.post<User>('/auth/register', userData);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await axios.get<User>('/auth/me');
  return response.data;
};
```