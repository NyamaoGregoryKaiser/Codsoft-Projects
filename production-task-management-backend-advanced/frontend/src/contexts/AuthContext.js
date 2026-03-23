import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token and fetch user data
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('access_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', new URLSearchParams({ username: email, password: password }));
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      throw error; // Re-throw for UI to handle
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      // Note: Registration is typically done by admin in this setup, or a public endpoint.
      // If public registration, the endpoint would be in /auth/register and might not require admin privileges.
      // For this example, assuming a public /register endpoint or admin creates users.
      // If it's a public register endpoint, it would be POST /users/ without auth header first.
      // For now, let's assume registration is part of the API, potentially open.
      const response = await api.post('/users/', userData); // Assuming this is open for new users
      console.log('Registration successful:', response.data