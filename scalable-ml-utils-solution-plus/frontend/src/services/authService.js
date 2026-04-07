```javascript
import api from './api';

export const register = async (username, email, password) => {
  try {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data; // Contains user and token
  } catch (error) {
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Contains user and token
  } catch (error) {
    throw error;
  }
};

export const getMe = async (token) => {
  try {
    // Token is automatically attached by interceptor, but we can pass it explicitly too
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};

export const updateMe = async (userData) => {
  try {
    const response = await api.patch('/users/updateMe', userData);
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
};
```