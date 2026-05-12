```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          // Token is valid and not expired
          setUser({
            id: decodedToken.sub,
            role: decodedToken.role,
            username: decodedToken.username, // Assuming username is also in token
            email: decodedToken.email // Assuming email is also in token
          });
        } else {
          // Token expired, attempt refresh or clear
          console.warn('Access token expired on load, attempting refresh or clearing.');
          handleLogout(); // Force logout if token is expired on load
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem('accessToken', data.tokens.access.token);
      localStorage.setItem('refreshToken', data.tokens.refresh.token);
      const decodedToken = jwtDecode(data.tokens.access.token);
      setUser({
        id: decodedToken.sub,
        role: decodedToken.role,
        username: data.user.username,
        email: data.user.email
      });
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const handleRegister = async (userData) => {
    try {
      const data = await apiRegister(userData);
      localStorage.setItem('accessToken', data.tokens.access.token);
      localStorage.setItem('refreshToken', data.tokens.refresh.token);
      const decodedToken = jwtDecode(data.tokens.access.token);
      setUser({
        id: decodedToken.sub,
        role: decodedToken.role,
        username: data.user.username,
        email: data.user.email
      });
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout(); // This just clears client-side tokens for this implementation
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      toast.info('Logged out.');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
    }
  };

  const isAuthenticated = !!user;
  const userRole = user?.role;

  const checkPermission = (requiredRoles) => {
    if (!isAuthenticated) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true; // No specific roles required means anyone logged in can access
    return requiredRoles.includes(userRole);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, userRole, loading, login: handleLogin, register: handleRegister, logout: handleLogout, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```