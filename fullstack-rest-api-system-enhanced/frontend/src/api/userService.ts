import axios from 'axios';
import { User } from '../types/auth'; // Assuming User type is defined

const API_URL = process.env.REACT_APP_API_BASE_URL + '/users';

let authToken: string | null = null;

export const setAuthTokenForUser = (token: string | null) => {
  authToken = token;
};

const getAuthHeaders = () => {
  if (!authToken) {
    throw new Error('No authentication token found. Please log in.');
  }
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };
};

export const getUsers = async (queryParams?: { page?: number; limit?: number }): Promise<{ users: User[]; total: number }> => {
  const response = await axios.get(API_URL, {
    ...getAuthHeaders(),
    params: queryParams,
  });
  return response.data;
};

// You can add more user-related API calls here (get user by ID, update user, delete user)
// Example:
export const getUserById = async (id: string): Promise<User> => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
  return response.data;
};