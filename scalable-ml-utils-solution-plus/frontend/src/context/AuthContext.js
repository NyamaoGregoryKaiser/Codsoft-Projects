```javascript
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { login as authLogin, register as authRegister, getMe as authGetMe } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    if (token) {
      try {
        setLoading(true);
        const userData = await authGetMe(token);
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setError('Session expired or invalid. Please log in again.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { user: userData, token: jwtToken } = await authLogin(email, password);
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { user: userData, token: jwtToken } = await authRegister(username, email, password);
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
    navigate('/login');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user && user.role === 'admin';

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    login,
    register,
    logout,
    // Method to update user data after profile update
    updateUser: (updatedUserData) => setUser(prev => ({ ...prev, ...updatedUserData }))
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
```