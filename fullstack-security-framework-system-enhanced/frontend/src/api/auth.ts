import apiClient from './axios';
import { User, LoginCredentials, RegisterData } from 'types/auth';

export const register = async (data: RegisterData): Promise<User> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data.data.user;
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data.data.user;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  // This endpoint would typically exist to verify session or get user details
  // For simplicity, we assume if cookies are present, backend will return user info on a protected route
  // A common pattern is `GET /auth/me` or `/users/me`
  // Here, we can try to fetch a protected resource, if it works, user is logged in
  try {
    const response = await apiClient.get('/users/me'); // Assuming an endpoint for current user
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch current user (likely not logged in):", error);
    return null;
  }
};