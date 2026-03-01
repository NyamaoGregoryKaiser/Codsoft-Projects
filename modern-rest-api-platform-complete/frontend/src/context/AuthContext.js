import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token by fetching user data
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('access_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', new URLSearchParams({ username: email, password: password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      
      // Fetch user details immediately after login to populate the user state
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data?.detail || error.message);
      throw new Error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```