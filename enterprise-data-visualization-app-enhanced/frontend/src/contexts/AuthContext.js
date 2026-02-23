```javascript
import React, { createContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../services/api'; // Our configured axios instance

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const accessToken = Cookies.get('access_token');
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      try {
        const response = await api.get('/protected'); // A simple endpoint to verify token and get user info
        setUser(response.data); // Assuming /protected returns { logged_in_as: userId, roles: [] }
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to verify token or fetch user:", error);
        logout(); // Token might be invalid or expired
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    // Potentially set up an interval to refresh token if it's nearing expiry
    // const refreshInterval = setInterval(refreshToken, 1000 * 60 * 10); // Every 10 minutes
    // return () => clearInterval(refreshInterval);
  }, [fetchUser]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/login', { username, password });
      const { access_token, refresh_token, user: userData } = response.data;

      Cookies.set('access_token', access_token, { expires: 1/24 }); // 1 hour expiration
      Cookies.set('refresh_token', refresh_token, { expires: 30 }); // 30 days expiration

      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, error: error.response?.data?.msg || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/register', { username, email, password });
      console.log("Registration successful:", response.data);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.msg || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login'; // Redirect to login after logout
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) {
      logout();
      return;
    }
    try {
      const response = await api.post('/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      });
      const { access_token } = response.data;
      Cookies.set('access_token', access_token, { expires: 1/24 });
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await fetchUser(); // Re-fetch user to update claims if necessary
    } catch (error) {
      console.error("Token refresh failed:", error.response?.data || error.message);
      logout();
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```