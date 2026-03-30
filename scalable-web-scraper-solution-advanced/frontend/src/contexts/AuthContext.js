import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const decoded = jwtDecode(token);
          // Check token expiration
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }
          
          // Validate token with backend to get fresh user data
          const response = await api.post('/auth/test-token');
          setIsAuthenticated(true);
          setUser({ id: response.data.id, email: response.data.email, fullName: response.data.full_name, role: response.data.is_superuser ? 'admin' : 'user' });
        }
      } catch (err) {
        console.error("Failed to load user or token invalid:", err);
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { username: email, password });
      const { access_token } = response.data;
      localStorage.setItem('accessToken', access_token);
      
      const userResponse = await api.post('/auth/test-token'); // Get full user data
      setIsAuthenticated(true);
      setUser({ id: userResponse.data.id, email: userResponse.data.email, fullName: userResponse.data.full_name, role: userResponse.data.is_superuser ? 'admin' : 'user' });
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};