import axios from './axiosConfig';

export const register = (name, email, password) => {
  return axios.post('/auth/register', { name, email, password });
};

export const login = (email, password) => {
  return axios.post('/auth/login', { email, password });
};

export const fetchUserProfile = () => {
  return axios.get('/users/me');
};