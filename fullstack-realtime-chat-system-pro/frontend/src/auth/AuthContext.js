import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from './AuthService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user && AuthService.checkTokenValidity()) {
      setCurrentUser(user);
    } else {
      // If token is invalid or expired, clear it and log out
      AuthService.logout(); // Will navigate to /login
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const user = await AuthService.login(username, password);
      setCurrentUser(user);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};