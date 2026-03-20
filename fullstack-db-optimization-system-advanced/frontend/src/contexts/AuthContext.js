import React, { createContext, useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '../api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          // Validate token with backend
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.data);
          } else {
            Cookies.remove('token');
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user on mount:", error);
          Cookies.remove('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const res = await authApi.login({ username, password });
      if (res.data.success) {
        Cookies.set('token', res.data.data.token, { expires: 7 }); // Store token for 7 days
        setUser(res.data.data);
        toast.success('Logged in successfully!');
        return true;
      }
      return false;
    } catch (error) {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    try {
      setLoading(true);
      const res = await authApi.register({ username, password });
      if (res.data.success) {
        Cookies.set('token', res.data.data.token, { expires: 7 });
        setUser(res.data.data);
        toast.success('Account created and logged in!');
        return true;
      }
      return false;
    } catch (error) {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    toast.info('Logged out.');
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### `frontend/src/hooks/useAuth.js`
```javascript