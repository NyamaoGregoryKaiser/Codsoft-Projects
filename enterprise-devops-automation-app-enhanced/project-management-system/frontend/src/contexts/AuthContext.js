```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedTokens = localStorage.getItem('tokens');
    if (storedUser && storedTokens) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const parsedTokens = JSON.parse(storedTokens);
        // Basic check for token expiry (consider a more robust check based on actual expiry date)
        const isAccessTokenExpired = parsedTokens.access && new Date(parsedTokens.access.expires) < new Date();
        if (!isAccessTokenExpired) {
          setUser(parsedUser);
        } else {
          console.warn("Access token expired. User needs to re-authenticate.");
          logoutUser(); // Log out if access token is expired
        }
      } catch (e) {
        console.error("Failed to parse stored user or tokens:", e);
        logoutUser();
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, tokens } = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tokens', JSON.stringify(tokens));
      setUser(userData);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const registerUser = async (name, email, password) => {
    try {
      const response = await authApi.register({ name, email, password });
      const { user: userData, tokens } = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('tokens', JSON.stringify(tokens));
      setUser(userData);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logoutUser = async () => {
    try {
      // await authApi.logout(); // Backend logout (optional, for invalidating refresh tokens)
    } catch (error) {
      console.error('Backend logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');
      setUser(null);
      navigate('/auth');
    }
  };

  const value = {
    user,
    loading,
    loginUser,
    registerUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```