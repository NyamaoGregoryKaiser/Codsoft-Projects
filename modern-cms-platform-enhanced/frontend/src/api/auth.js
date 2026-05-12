```javascript
import api from './axios';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  // For JWT, logout is primarily client-side. We could optionally hit a backend endpoint
  // to invalidate refresh tokens if they were stored server-side.
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // No API call needed for this setup, just client-side token removal.
  return Promise.resolve({ message: 'Logged out successfully' });
};
```