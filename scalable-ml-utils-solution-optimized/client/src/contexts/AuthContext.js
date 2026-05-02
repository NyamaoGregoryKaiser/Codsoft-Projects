import React, { createContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../api/api';
import { message } from 'antd';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = Cookies.get('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        message.error('Session expired or invalid, please login again.');
        logout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      Cookies.set('token', res.data.token, { expires: 7 }); // Set cookie to expire in 7 days
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      setIsAuthenticated(true);
      message.success('Logged in successfully!');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      message.error(errorMsg);
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', { username, email, password });
      // Optionally auto-login after register
      Cookies.set('token', res.data.token, { expires: 7 });
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      setIsAuthenticated(true);
      message.success('Account created and logged in!');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      message.error(errorMsg);
      console.error('Register error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    message.info('Logged out successfully.');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};