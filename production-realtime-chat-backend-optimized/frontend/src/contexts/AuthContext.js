```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserFromStorage = useCallback(async () => {
    try {
      const storedTokens = localStorage.getItem('tokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        if (tokens.access && tokens.refresh) {
          // Verify access token validity or try to refresh
          // A more robust solution would involve decoding the JWT and checking expiry
          // For now, rely on API interceptor to refresh automatically.
          // Fetch user info based on the token if necessary, or assume it's valid for now.
          // For this example, we'll assume the user object is also stored or can be fetched
          // upon successful login/refresh.
          // A simple way is to pass user info in login/register response and store it.
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            // If user object not found but tokens exist, try to fetch user details
            // This might involve an additional API call like /v1/users/me
            // For now, we'll assume the user details are part of the login/refresh response.
            // If `apiClient` refreshes successfully, it means tokens are fine.
            setIsAuthenticated(true);
            // Optionally fetch user profile here if not stored.
            // E.g., const { data: profile } = await apiClient.get('/users/me'); setUser(profile);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage or refresh token:', error);
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, tokens } = response.data; // Backend sends { data: { user, tokens } }
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      const { user: userData, tokens } = response.data; // Backend sends { data: { user, tokens } }
      localStorage.setItem('tokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem('tokens'));
      if (tokens && tokens.refresh) {
        await apiClient.post('/auth/logout', { refreshToken: tokens.refresh.token });
      }
    } catch (error) {
      console.error('Logout failed on server:', error);
      // Even if server logout fails, clear client state for security
    } finally {
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```