import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode v4+
import authService from '../services/auth.service';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // in seconds
        if (decoded.exp > currentTime) {
          // Token is valid
          setUser({
            id: decoded.userId,
            username: decoded.sub,
            email: decoded.email,
            roles: decoded.roles ? decoded.roles.split(',') : [] // Roles are a comma-separated string
          });
          setIsAuthenticated(true);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default header for Axios
        } else {
          // Token expired
          localStorage.removeItem('accessToken');
          setUser(null);
          setIsAuthenticated(false);
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsAuthenticated(false);
        delete api.defaults.headers.common['Authorization'];
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      delete api.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (usernameOrEmail, password) => {
    const data = await authService.login(usernameOrEmail, password);
    if (data && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      checkAuth(); // Re-check auth status to update user context
      return data;
    }
    throw new Error('Login failed: No access token received');
  };

  const register = async (username, email, password) => {
    const data = await authService.register(username, email, password);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```