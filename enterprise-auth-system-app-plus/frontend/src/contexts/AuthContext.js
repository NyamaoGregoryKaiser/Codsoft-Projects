```javascript
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth';
import { getCurrentUser } from '../api/user';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserFromToken = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp > currentTime) {
          // Token is valid, fetch full user profile
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          console.log("Access token expired on load, need refresh on next request.");
          // Token expired, but we might still have a refresh token.
          // Don't set isAuthenticated to true, let interceptor handle refresh on next API call.
          setIsAuthenticated(false); 
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error("Error decoding or fetching user from token:", error);
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await apiLogin(email, password);
      await loadUserFromToken(); // Reload user after successful login
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const newUser = await apiRegister(userData);
      console.log('Registration successful:', newUser);
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error, clearing local state anyway:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      navigate('/login');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```