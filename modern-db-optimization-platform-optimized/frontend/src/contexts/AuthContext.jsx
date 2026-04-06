import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import apiClient from '../api/apiClient'; // Import to clear token on error

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading state

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authApi.checkAuth();
        if (userData) {
          setUser(userData);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token present but invalid/expired on backend
          localStorage.removeItem('token');
          delete apiClient.defaults.headers.common['Authorization'];
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error during initial auth check:', error);
      localStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await authApi.register(username, email, password);
      localStorage.setItem('token', data.token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;