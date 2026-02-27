```typescript
import api from './auth'; // Use the configured axios instance
import { User, UpdateUserData } from '../types';

export const users = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me'); // Assuming a dedicated endpoint or logic to get current user details
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
```