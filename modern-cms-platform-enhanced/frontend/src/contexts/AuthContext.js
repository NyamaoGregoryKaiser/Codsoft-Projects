```javascript
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { login, register, getMe } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    if (token) {
      try {
        const userData = await getMe();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to fetch user:', error);
        logout(); // Clear invalid token
      } finally {
        setLoading(false);
      }
    } else {
      setUser(null);
      localStorage.removeItem('user');
      setLoading(false);
    }
  }, [token]); // token is a dependency here. loadUser should re-run if token changes.

  useEffect(() => {
    setLoading(true);
    loadUser();
  }, [loadUser]); // Ensure loadUser runs when component mounts or token changes

  const userLogin = async (credentials) => {
    const { user: userData, token: jwtToken } = await login(credentials);
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/dashboard');
    return userData;
  };

  const userRegister = async (userData) => {
    const response = await register(userData);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user && user.role === 'admin';
  const isAuthor = user && (user.role === 'admin' || user.role === 'author');

  const hasRole = (roles) => {
    if (!user || !roles || roles.length === 0) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      isAdmin,
      isAuthor,
      hasRole,
      login: userLogin,
      register: userRegister,
      logout,
      loadUser // Expose loadUser to allow components to manually refresh user data
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```