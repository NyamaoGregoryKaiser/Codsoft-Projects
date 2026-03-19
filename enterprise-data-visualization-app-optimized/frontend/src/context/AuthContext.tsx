```typescript
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loginUser, registerUser, refreshAccessToken, logoutUser } from '../services/auth';
import { User, LoginCredentials, RegisterCredentials, AuthContextType } from '../utils/types';
import api from '../services/api'; // Assuming you have an Axios instance configured

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // To check initial auth status

  const getTokens = useCallback(() => {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  }, []);

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setIsAuthenticated(true);
    // Set Axios default header for all subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }, []);

  const removeTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // Function to load user details from API after authentication
  const fetchCurrentUser = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      removeTokens();
      setIsLoading(false);
      return null;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    try {
      const response = await api.get<User>('/auth/me'); // Endpoint to get current user details
      setUser(response.data);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      removeTokens(); // Token might be invalid or expired
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [removeTokens]);

  // Initial load: Check for existing tokens and validate
  useEffect(() => {
    const initializeAuth = async () => {
      const { accessToken, refreshToken } = getTokens();
      if (accessToken) {
        // Try to fetch user with current token
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setIsLoading(false);
          return;
        }
      }
      if (refreshToken) {
        // If access token failed, try to refresh
        try {
          const { accessToken: newAccessToken } = await refreshAccessToken(refreshToken);
          setTokens(newAccessToken, refreshToken);
          await fetchCurrentUser(); // Fetch user with new access token
        } catch (error) {
          console.error('Failed to refresh token:', error);
          removeTokens();
        }
      }
      setIsLoading(false); // Done loading initial auth state
    };

    initializeAuth();
  }, [getTokens, setTokens, removeTokens, fetchCurrentUser]);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { access_token, refresh_token, user: userData } = await loginUser(credentials);
      setTokens(access_token, refresh_token);
      setUser(userData); // Assuming loginUser also returns user data, else fetch it
      // Or call fetchCurrentUser() here
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      removeTokens();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      await registerUser(credentials);
      // After successful registration, you might want to automatically log them in
      await login({ username: credentials.username, password: credentials.password });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      try {
        await logoutUser(refreshToken); // Optional: if backend supports token blacklisting
      } catch (error) {
        console.error('Logout failed on backend:', error);
        // Still proceed with local logout
      }
    }
    removeTokens();
    setIsLoading(false);
  }, [getTokens, removeTokens]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    getTokens,
    setTokens,
    removeTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
```