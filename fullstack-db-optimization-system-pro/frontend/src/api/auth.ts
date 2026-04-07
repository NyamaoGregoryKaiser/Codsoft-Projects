import { api } from './index';
import { LoginForm, RegisterForm, Token, User } from '@types';

export const authApi = {
  login: (credentials: LoginForm) =>
    api.post<Token, LoginForm>('/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(credentials as Record<string, string>).toString(),
    }),
  register: (userData: RegisterForm) =>
    api.post<User, RegisterForm>('/auth/register', userData),
  getMe: () =>
    api.get<User>('/auth/me'),
};