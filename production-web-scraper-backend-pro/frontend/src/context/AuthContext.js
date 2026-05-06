```javascript
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromToken = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Check for token expiration
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp > currentTime) {
          // You might fetch full user details from /users/me endpoint here if needed
          // For now, reconstruct user object from token claims
          setUser({
            id: decodedToken.id,
            username: decodedToken.sub,
            email: decodedToken.email || decodedToken.sub, // Assuming email can be in token or fallback to username
            is_admin: decodedToken.is_admin || false,
            is_active: true, // Assuming active if token is valid
          });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('Token expired, please log in again.');
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to decode token or token is invalid:', e);
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login_json', { username, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('accessToken', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem('accessToken', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```