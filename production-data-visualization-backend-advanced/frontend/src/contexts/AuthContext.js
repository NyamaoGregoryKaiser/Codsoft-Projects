import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) { // Token is not expired
          setUser({ id: decoded.id, role: decoded.role || 'user', username: decoded.username || 'User' }); // Extract role and username if available
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, data: { user: userData } } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      const { token, data: { user: userData } } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};