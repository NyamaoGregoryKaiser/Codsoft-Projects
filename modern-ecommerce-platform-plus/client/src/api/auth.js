```javascript
// client/src/api/auth.js
import apiClient from './apiClient';

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/auth/profile', profileData);
  return response.data;
};

```