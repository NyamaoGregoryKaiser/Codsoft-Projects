```typescript
import { User } from '../types';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

/**
 * Stores the access token in localStorage.
 * @param token The JWT access token string.
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Retrieves the access token from localStorage.
 * @returns The JWT access token string or null if not found.
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Removes the access token from localStorage.
 */
export const removeAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Stores user information in localStorage.
 * @param user The user object to store.
 */
export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Retrieves user information from localStorage.
 * @returns The user object or null if not found.
 */
export const getStoredUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Removes user information from localStorage.
 */
export const removeStoredUser = (): void => {
  localStorage.removeItem(USER_KEY);
};
```