```javascript
import apiClient from './apiClient';

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', new URLSearchParams({ username: email, password: password }));
    // Store access token in local storage
    localStorage.setItem('accessToken', response.data.access_token);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails on server, clear client-side tokens
    localStorage.removeItem('accessToken');
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```