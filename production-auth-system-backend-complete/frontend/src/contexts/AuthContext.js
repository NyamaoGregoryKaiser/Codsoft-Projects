import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to save tokens to localStorage (or httpOnly cookies in production)
  const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };

  // Function to remove tokens
  const removeTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Function to parse JWT and update user state
  const parseToken = useCallback((token) => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const { user_id, email, roles } = decoded;
        return { id: user_id, email, roles };
      } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
      }
    }
    return null;
  }, []);

  // Check authentication status on mount and token changes
  const checkAuth = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken && !refreshToken) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Check if access token is valid
    if (accessToken) {
      const decodedAccess = parseToken(accessToken);
      if (decodedAccess && decodedAccess.exp * 1000 > Date.now()) {
        setUser(decodedAccess);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
    }

    // If access token is expired or missing, try to refresh
    if (refreshToken) {
      const decodedRefresh = parseToken(refreshToken);
      if (decodedRefresh && decodedRefresh.exp * 1000 > Date.now()) {
        try {
          const response = await apiClient.post('/auth/refresh-token', { refresh_token: refreshToken });
          const { access_token: newAccessToken, refresh_token: newRefreshToken, user: newUser } = response.data;
          setTokens(newAccessToken, newRefreshToken);
          setUser(newUser); // The API refresh endpoint returns the full user object
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } catch (error) {
          console.error("Failed to refresh token:", error);
          removeTokens();
        }
      } else {
        console.warn("Refresh token expired.");
        removeTokens();
      }
    }

    // If all else fails
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, [parseToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, refresh_token, user: loggedInUser } = response.data;
      setTokens(access_token, refresh_token);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      removeTokens();
      setIsAuthenticated(false);
      throw error; // Re-throw to allow component to handle specific error messages
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
      } catch (error) {
        console.error("Logout failed (server-side):", error);
        // Continue with client-side logout even if server fails
      }
    }
    removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  // Check if user has a specific role
  const hasRole = useCallback((roleNames) => {
    if (!user || !user.roles) {
      return false;
    }
    const userRoleNames = user.roles.map(r => r.name);
    return roleNames.some(role => userRoleNames.includes(role));
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    checkAuth // Expose checkAuth for manual re-checking (e.g., after profile update)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
```