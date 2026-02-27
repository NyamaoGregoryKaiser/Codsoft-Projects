import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login, register, getCurrentUser as fetchCurrentUser } from '../api/projectPulseApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const response = await fetchCurrentUser(); // Validate token and get user info
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed or user not found:', error);
        localStorage.removeItem('jwtToken');
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('Session expired or invalid. Please log in again.');
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const signIn = async (username, password) => {
    setAuthError(null);
    try {
      const response = await login({ username, password });
      localStorage.setItem('jwtToken', response.data.token);
      await loadUserFromToken(); // Reload user info to set isAuthenticated and user state
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      setAuthError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: authError };
    }
  };

  const signUp = async (userData) => {
    setAuthError(null);
    try {
      const response = await register(userData);
      localStorage.setItem('jwtToken', response.data.token);
      await loadUserFromToken();
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      setAuthError(error.response?.data?.message || 'Registration failed.');
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: authError };
    }
  };

  const signOut = () => {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, authError, signIn, signUp, signOut, loadUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};
```
**`frontend/src/hooks/useAuth.js`**
```javascript