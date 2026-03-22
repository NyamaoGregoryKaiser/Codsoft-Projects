```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user'); // Storing user info for quick access
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Optionally, verify token on backend or refresh it
      } catch (e) {
        console.error("Failed to parse stored user", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: userData } = response.data;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(receivedToken);
      setUser(userData);
      toast.success(`Welcome, ${userData.firstName || userData.email}!`);
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      // api interceptor handles toast
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { token: receivedToken, user: newUser } = response.data;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(receivedToken);
      setUser(newUser);
      toast.success(`Account created for ${newUser.firstName || newUser.email}!`);
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      // api interceptor handles toast
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.info('You have been logged out.');
    navigate('/login');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```