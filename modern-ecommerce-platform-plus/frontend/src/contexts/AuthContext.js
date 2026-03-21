import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import * as authApi from '../api/auth';
import { setAuthToken } from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load tokens from cookies
  const loadAuthTokens = useCallback(() => {
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (accessToken) {
      setAuthToken(accessToken);
      // In a real app, you'd decode JWT or make an API call to get user info
      // For simplicity, we'll assume a valid token means authenticated.
      // A '/me' endpoint would be ideal here.
      setIsAuthenticated(true);
      // Mock user data for now if no '/me' endpoint is called
      setUser({ id: 'mock', name: 'User', email: 'user@example.com', role: 'user' });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
    return { accessToken, refreshToken };
  }, []);

  // Initial load
  useEffect(() => {
    loadAuthTokens();
  }, [loadAuthTokens]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { user: userData, tokens } = response.data;
      
      Cookies.set('accessToken', tokens.access.token, { expires: new Date(tokens.access.expires) });
      Cookies.set('refreshToken', tokens.refresh.token, { expires: new Date(tokens.refresh.expires) });
      
      setAuthToken(tokens.access.token);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authApi.register(name, email, password);
      const { userId, tokens } = response.data;

      Cookies.set('accessToken', tokens.access.token, { expires: new Date(tokens.access.expires) });
      Cookies.set('refreshToken', tokens.refresh.token, { expires: new Date(tokens.refresh.expires) });

      setAuthToken(tokens.access.token);
      setUser({ id: userId, name, email, role: 'user' }); // Mock user
      setIsAuthenticated(true);
      return { userId, name, email, role: 'user' };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setAuthToken(null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};