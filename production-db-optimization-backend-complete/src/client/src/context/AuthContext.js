import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { getMe as fetchMe, login as apiLogin, register as apiRegister } from '../api/auth';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const userData = await fetchMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to load user from token:', error);
          Cookies.remove('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { token, ...userData } = await apiLogin(email, password);
      Cookies.set('token', token, { expires: 1 / 24, secure: process.env.NODE_ENV === 'production' }); // 1 hour expiration
      setUser(userData);
      setIsAuthenticated(true);
      message.success('Login successful!');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const { token, ...userData } = await apiRegister(username, email, password);
      Cookies.set('token', token, { expires: 1 / 24, secure: process.env.NODE_ENV === 'production' });
      setUser(userData);
      setIsAuthenticated(true);
      message.success('Registration successful! You are now logged in.');
      return true;
    } catch (error) {
      message.error(error.response?.data?.message || 'Registration failed');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false);
    setUser(null);
    message.info('You have been logged out.');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout, setIsAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);