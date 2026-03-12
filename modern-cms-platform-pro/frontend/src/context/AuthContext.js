import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const accessToken = localStorage.getItem('access_token');
    return accessToken ? jwt_decode(accessToken) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = useCallback(async (email, password) => {
    try {
      const response = await API.auth.login({ email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser(jwt_decode(response.data.access));
      return response.data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await API.auth.logout(refreshToken);
      } catch (error) {
        console.error('Logout failed (token might already be invalid):', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const checkUserStatus = () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const decodedToken = jwt_decode(accessToken);
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            logout(); // Token expired, log out
          } else {
            setUser(decodedToken);
          }
        } catch (error) {
          console.error('Invalid access token:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUserStatus();

    // Optional: Refresh token periodically
    const REFRESH_INTERVAL = 1000 * 60 * 15; // Every 15 minutes
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && user) {
        try {
          const response = await API.auth.refresh({ refresh: refreshToken });
          localStorage.setItem('access_token', response.data.access);
          setUser(jwt_decode(response.data.access));
        } catch (error) {
          console.error('Failed to auto-refresh token:', error);
          logout();
        }
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [logout, user]);

  const isStaff = user?.is_staff;
  const isAdmin = user?.is_superuser;

  const contextData = {
    user,
    login,
    logout,
    loading,
    isStaff,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <div>Loading authentication...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```

#### `frontend/src/components/Auth/RequireAuth.js`

```javascript