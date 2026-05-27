```javascript
import React, { createContext, useState, useEffect } from 'react';
import { login, register, getMe } from '../api';
import jwtDecode from 'jwt-decode'; // npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const loadUserFromToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token is not expired (basic check, server will do full validation)
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Token expired.');
            logout();
            return;
          }

          // Fetch user details to ensure token is valid and get up-to-date user data
          const userData = await getMe(token);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error decoding or fetching user from token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUserFromToken();
  }, []);

  const handleLogin = async (email, password) => {
    setAuthError(null);
    try {
      const response = await login({ email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Login failed');
      console.error('Login error:', error);
      return false;
    }
  };

  const handleRegister = async (username, email, password) => {
    setAuthError(null);
    try {
      const response = await register({ username, email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Registration failed');
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    authError,
    login: handleLogin,
    register: handleRegister,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
```