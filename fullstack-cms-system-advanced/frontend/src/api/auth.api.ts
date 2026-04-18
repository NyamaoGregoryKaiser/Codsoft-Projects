import axiosInstance from './axiosInstance';
import { AuthTokens, LoginDto, User } from '../types';

export const loginUser = async (credentials: LoginDto): Promise<{ tokens: AuthTokens; user: User }> => {
  const response = await axiosInstance.post('/auth/login', credentials);
  const { accessToken, refreshToken, user } = response.data;
  return { tokens: { accessToken, refreshToken }, user };
};

export const getAuthenticatedUser = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};