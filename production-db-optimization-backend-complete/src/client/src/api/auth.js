import axios from './axiosConfig'; // Use the configured axios instance

export const register = async (username, email, password) => {
  const response = await axios.post('/auth/register', { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await axios.post('/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await axios.get('/auth/me');
  return response.data;
};