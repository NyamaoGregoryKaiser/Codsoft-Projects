import apiClient from './apiClient';

export const register = async (username, email, password) => {
  const response = await apiClient.post('/auth/register', { username, email, password });
  return response.data.data;
};

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data.data;
};

export const checkAuth = async () => {
  try {
    const response = await apiClient.get('/auth/profile');
    return response.data.data;
  } catch (error) {
    // If token is invalid or expired, server will return 401
    console.error('Auth check failed:', error);
    return null;
  }
};