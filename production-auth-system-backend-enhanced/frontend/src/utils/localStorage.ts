const ACCESS_TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getUser = <T>(): T | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setUser = <T>(user: T): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const clearLocalStorage = (): void => {
  removeAccessToken();
  removeUser();
};