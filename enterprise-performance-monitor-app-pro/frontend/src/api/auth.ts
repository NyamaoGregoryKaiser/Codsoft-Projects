import axios from './axiosConfig';
import { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const registerUser = async (userData: any): Promise<AuthResponse> => {
  const response = await axios.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials: any): Promise<AuthResponse> => {
  const response = await axios.post('/auth/login', credentials);
  return response.data;
};

export const fetchMe = async (): Promise<User> => {
  const response = await axios.get('/auth/me');
  return response.data;
};