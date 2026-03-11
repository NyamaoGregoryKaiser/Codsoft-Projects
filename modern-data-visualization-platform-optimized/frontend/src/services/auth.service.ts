import { loginApi, registerApi } from '../api/auth.api';
import { User } from '../types';

const USER_KEY = 'user';

export const login = async (username: string, password: string): Promise<User> => {
  const response = await loginApi(username, password);
  const user: User = {
    id: response.data.id,
    username: response.data.username,
    email: response.data.email,
    roles: response.data.roles,
    token: response.data.token,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (username: string, email: string, password: string): Promise<void> => {
  await registerApi(username, email, password);
};

export const logout = () => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export const getToken = (): string | null => {
  const user = getCurrentUser();
  return user ? user.token : null;
};