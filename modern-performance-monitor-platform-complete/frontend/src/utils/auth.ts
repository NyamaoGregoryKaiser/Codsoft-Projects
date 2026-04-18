```typescript
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string; // subject (username)
  role: string;
  jti: string; // JWT ID (user ID)
  exp: number; // expiration timestamp
  iat: number; // issued at timestamp
  iss: string; // issuer
}

const TOKEN_KEY = 'jwt_token';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const deleteToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }
  try {
    const decoded = decodeToken(token);
    // Check if token exists and is not expired
    if (decoded && decoded.exp * 1000 > Date.now()) {
      return true;
    } else {
      deleteToken(); // Token expired
      return false;
    }
  } catch (error) {
    deleteToken();
    return false;
  }
};

export const getUserRole = (): string | null => {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded ? decoded.role : null;
};
```