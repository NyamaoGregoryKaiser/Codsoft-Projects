```javascript
// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../api/auth';
import { toast } from 'react-toastify';

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
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { user: userData, token: userToken } = await authApi.login({ email, password });
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name}!`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const { user: userData, token: userToken } = await authApi.register({ name, email, password });
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Account created! Welcome, ${userData.name}!`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Logged out successfully.');
  };

  const updateUser = async (updateData) => {
    try {
      const updatedUser = await authApi.updateProfile(updateData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

```