import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const decodedToken = jwtDecode(accessToken);
          if (decodedToken.exp * 1000 > Date.now()) { // Check if access token is not expired
            // Attempt to fetch user data if access token exists
            const response = await api.get('/users/me');
            setUser(response.data);
            setIsAuthenticated(true);
            console.log('User loaded from storage:', response.data.username);
          } else {
            console.log('Access token expired. Will try to refresh on next API call.');
            // Token expired, but we keep isAuthenticated to true,
            // the interceptor will handle refreshing on first failed request.
            // Or explicitly try to refresh here if you want proactive refresh.
            // For now, let interceptor handle it on demand.
            setIsAuthenticated(true); // Assume authenticated until refresh fails
          }
        } catch (error) {
          console.error('Failed to decode or verify access token on load:', error);
          localStorage.clear(); // Clear invalid tokens
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setUser(user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
          await api.post('/auth/logout', {}, {
              headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'X-Refresh-Token': refreshToken // Custom header for refresh token
              }
          });
      }
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      console.log('User logged out.');
    }
  };

  const hasRole = (roleName) => {
    return user && user.role && user.role.name === roleName;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, hasRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```