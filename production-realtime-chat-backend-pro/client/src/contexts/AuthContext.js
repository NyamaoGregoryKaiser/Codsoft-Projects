```javascript
import React, { createContext, useState, useEffect, useCallback } from 'react';
import API from '../api/api';
import authService from '../services/authService'; // Frontend auth service

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (username, email, password) => {
    setAuthError(null);
    try {
      const data = await authService.register(username, email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setAuthError(null);
    // Optionally call backend logout endpoint, but for JWT, client-side removal is sufficient
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    authError,
    login,
    register,
    logout,
    loadUser // Expose loadUser for manual re-fetching if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```