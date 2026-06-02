// Note: User service methods are typically restricted to ADMIN roles.
// In this frontend, we'll only call this if the user has admin role.
import api from './api';

const USERS_API_URL = '/users';

export const getAllUsers = () => {
  return api.get(USERS_API_URL);
};

export const getUserById = (id) => {
  return api.get(`${USERS_API_URL}/${id}`);
};

export const updateUser = (id, userData) => {
  return api.put(`${USERS_API_URL}/${id}`, userData);
};

export const deleteUser = (id) => {
  return api.delete(`${USERS_API_URL}/${id}`);
};