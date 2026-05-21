import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser as fetchCurrentUser, logoutUser } from '../services/auth';
import api from '../services/api'; // Import the axios instance to set/unset auth header

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setAuthToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAuthToken(token);
      try {
        const currentUser = await fetchCurrentUser(); // This will use the token already set in api.defaults.headers
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Token invalid or expired, logging out:", err);
        setAuthToken(null);
        setError("Session expired or invalid. Please log in again.");
      }
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, [setAuthToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginUser(email, password);
      setAuthToken(data.access_token);
      await checkAuth(); // Fetch user details after login
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      await registerUser(username, email, password);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutUser(); // Clear token on backend if needed, though JWT is stateless
    } catch (err) {
      console.warn("Logout failed on server, proceeding client-side logout:", err);
    } finally {
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    setAuthToken,
    setError // Allow components to clear/set error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};