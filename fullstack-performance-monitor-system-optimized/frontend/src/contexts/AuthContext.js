```javascript
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser, clearAuthData } from '../utils/auth';
import { loginUser as apiLogin, registerUser as apiRegister } from '../api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to load user and token from local storage
  const loadAuthData = useCallback(() => {
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      // Basic token validation (e.g., check if it's broadly valid, not expired)
      // A more robust solution would involve validating on the backend or decoding JWT locally
      // For simplicity, we assume if a token and user exist, they are valid for now.
      setUser(storedUser);
      setIsAuthenticated(true);
    } else {
      clearAuthData(); // Ensure no stale data
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiLogin({ email, password });
      const { user: userData, token } = response.data.data;
      saveToken(token);
      saveUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.');
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await apiRegister({ username, email, password });
      const { user: userData, token } = response.data.data;
      saveToken(token);
      saveUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Registration successful! You are now logged in.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('You have been logged out.');
  };

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
```