```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally, verify token or fetch profile on app load
      fetchUserProfile(storedToken);
    }
    setLoading(false);
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await api.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };


  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```