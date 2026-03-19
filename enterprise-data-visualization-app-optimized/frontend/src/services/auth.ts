```typescript
import api from './api';
import { LoginCredentials, RegisterCredentials, AuthTokens, User } from '../utils/types';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user?: User; // Optionally return user info on login
}

interface RefreshResponse {
  access_token: string;
}

interface MessageResponse {
  message: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (credentials: RegisterCredentials): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/auth/register', credentials);
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshResponse> => {
  // Directly use axios without interceptors for refresh token request
  // to prevent infinite loop of 401 errors
  const response = await api.post<RefreshResponse>('/auth/refresh', {}, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
    _retry: true // Mark this request as retried to avoid infinite loop
  });
  return response.data;
};

export const logoutUser = async (refreshToken: string): Promise<MessageResponse> => {
  // This assumes a backend endpoint for blacklisting refresh tokens
  // If not, simply clear tokens client-side.
  const response = await api.post<MessageResponse>('/auth/logout', { token: refreshToken });
  return response.data;
};
```