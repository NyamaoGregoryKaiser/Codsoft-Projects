import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Axios instance with token
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
  });

  authAxios.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (err) => Promise.reject(err)
  );

  authAxios.interceptors.response.use(
    (response) => response,
    async (err) => {
      // Handle 401 Unauthorized for token expiration
      if (err.response && err.response.status === 401) {
        console.log('Token expired or invalid. Logging out.');
        logout(); // Logout user if token is invalid
        // Optionally, try refreshing token here if implemented
      }
      return Promise.reject(err);
    }
  );

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await authAxios.get('/users/me');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setUser(null);
      setError('Failed to load user data.');
      localStorage.removeItem('access_token'); // Clear invalid token
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]); // authAxios is dynamic, so pass token directly

  useEffect(() => {
    fetchCurrentUser();
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token`, {
        username: email,
        password: password,
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('access_token', response.data.access_token);
      setToken(response.data.access_token);
      setError(null);
      return true;
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
      setError(null);
      return true;
    } catch (err) {
      console.error('Registration failed:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return { token, user, loading, error, login, register, logout, authAxios };
};

export default useAuth;
```