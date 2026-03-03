import axios from 'axios';
import { AuthPayload, RegisterPayload, User, AuthResponse } from '../types/auth';

const API_URL = process.env.REACT_APP_API_BASE_URL + '/auth';

export const register = async (userData: RegisterPayload): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const login = async (credentials: AuthPayload): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data;
};

export const getMe = async (token: string): Promise<User> => {
  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};