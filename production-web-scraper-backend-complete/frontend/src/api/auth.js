import apiClient from './apiClient';

export const loginUser = (email, password) => {
  return apiClient.post('/auth/login', { email, password });
};

export const registerUser = (name, email, password, role) => {
  return apiClient.post('/auth/register', { name, email, password, role });
};