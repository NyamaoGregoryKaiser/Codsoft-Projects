import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as authService from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = useCallback(() => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp > currentTime) {
          setIsAuthenticated(true);
          setUser({
            username: decodedToken.sub,
            role: decodedToken.auth, // Assuming 'auth' claim holds the role
            id: decodedToken.userId // Assuming 'userId' claim holds the user ID
          });
        } else {
          localStorage.removeItem('jwtToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to decode token or check auth status:", error);
      localStorage.removeItem('jwtToken');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      const { token, username, role } = response.data;
      localStorage.setItem('jwtToken', token);
      const decodedToken = jwtDecode(token);
      setIsAuthenticated(true);
      setUser({ username, role, id: decodedToken.userId }); // Assuming userId is in the token
      setLoading(false);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      const { token, username, role } = response.data;
      localStorage.setItem('jwtToken', token);
      const decodedToken = jwtDecode(token);
      setIsAuthenticated(true);
      setUser({ username, role, id: decodedToken.userId });
      setLoading(false);
      return response;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;