```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api'; // Assuming you have an API service
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error("Failed to fetch user:", error);
          logout();
          toast.error("Session expired or invalid. Please log in again.");
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/token', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      toast.success("Logged in successfully!");
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.detail || "Login failed.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setLoading(true);
      await api.post('/auth/register', { email, password });
      toast.success("Registration successful! Please log in.");
      navigate('/login');
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.detail || "Registration failed.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common['Authorization'];
    toast.info("You have been logged out.");
    navigate('/login');
  };

  // Check token expiration (basic check, server-side is authoritative)
  const isTokenExpired = () => {
    if (!token) return true;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (!decoded.exp) return false; // No exp claim
      const expirationTime = dayjs.unix(decoded.exp);
      return dayjs().isAfter(expirationTime);
    } catch (e) {
      console.error("Error decoding token:", e);
      return true;
    }
  };

  useEffect(() => {
    if (token && !isTokenExpired()) {
      // Token is valid, ensure user data is present
      if (!user) {
        // If user data is missing but token is present and valid, refetch user
        // This handles cases where user might manually clear session storage but not local storage
        api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(response => {
            setUser(response.data);
          })
          .catch(error => {
            console.error("Failed to re-fetch user after valid token:", error);
            logout();
            toast.error("Session re-validation failed. Please log in.");
          });
      }
    } else if (token && isTokenExpired()) {
      logout();
      toast.error("Your session has expired. Please log in again.");
    }
  }, [token, user]); // Depend on user as well to trigger re-fetch if null


  const authContextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```