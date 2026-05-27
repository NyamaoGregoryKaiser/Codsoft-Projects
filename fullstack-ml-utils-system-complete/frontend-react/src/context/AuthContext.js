import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser } from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(true);

  // Decode token and set user info
  const decodeToken = useCallback((jwtToken) => {
    if (!jwtToken) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    try {
      const decoded = jwtDecode(jwtToken);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.warn('Token expired');
        logout();
        return;
      }
      setUser({
        id: parseInt(decoded.user_id, 10),
        role: decoded.user_role,
        email: decoded.email, // Assuming email is also in the token payload
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error decoding token:', error);
      logout();
    }
  }, []);

  useEffect(() => {
    if (token) {
      decodeToken(token);
    }
    setIsLoading(false);
  }, [token, decodeToken]);

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      const newToken = response.data.token;
      localStorage.setItem('jwtToken', newToken);
      setToken(newToken);
      decodeToken(newToken);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setToken(null);
      localStorage.removeItem('jwtToken');
      setIsAuthenticated(false);
      setUser(null);
      throw error; // Re-throw for UI to handle
    }
  };

  const register = async (email, password) => {
    try {
      await registerUser(email, password);
      // After successful registration, optionally log them in
      return login(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jwtToken');
  };

  const hasRole = useCallback((requiredRole) => {
    if (!user || !user.role) return false;
    return user.role === requiredRole || user.role === 'admin';
  }, [user]);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isLoading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
```