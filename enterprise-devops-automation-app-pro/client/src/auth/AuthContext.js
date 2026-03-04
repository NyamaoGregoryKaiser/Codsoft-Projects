import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import authService from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            handleLogout();
            return;
          }
          const res = await authService.getMe();
          setUser(res.data.data.user);
        } catch (error) {
          console.error("Failed to fetch user data with token:", error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken); // Trigger useEffect to load user
      const decodedUser = jwtDecode(newToken);
      setUser({ id: decodedUser.id, role: decodedUser.role }); // Simplified user for immediate update
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      return false;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const res = await authService.register({ username, email, password });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const decodedUser = jwtDecode(newToken);
      setUser({ id: decodedUser.id, role: decodedUser.role });
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error("Registration failed:", error.response?.data?.message || error.message);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // await authService.logout(); // Optional: hit logout API endpoint
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, handleLogin, handleRegister, handleLogout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);