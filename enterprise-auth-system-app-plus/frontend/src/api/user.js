```javascript
import apiClient from './apiClient';

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateCurrentUser = async (userData) => {
  try {
    const response = await apiClient.put('/users/me', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get(`/users?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```