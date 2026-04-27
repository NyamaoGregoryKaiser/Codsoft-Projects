'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { User, AuthContextType } from '../types';
import { AuthService } from '../services/api'; // Your API service for auth
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // To manage initial auth check
  const router = useRouter();

  const loadUserFromToken = useCallback(async () => {
    const accessToken = Cookies.get('accessToken'); // Assuming accessToken is stored in a cookie
    if (accessToken) {
      try {
        // You might have an API endpoint to verify token and get user profile
        const profile = await AuthService.getProfile();
        setUser(profile);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed or profile fetch error:', error);
        Cookies.remove('accessToken');
        localStorage.removeItem('accessToken'); // Clear from local storage as well
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const { access_token } = await AuthService.login(username, password);
      // Store token securely, e.g., in an HttpOnly cookie or Local Storage (with caution)
      Cookies.set('accessToken', access_token, { expires: 7 }); // 7 days expiration
      localStorage.setItem('accessToken', access_token); // For WebSocket client to access easily
      await loadUserFromToken(); // Fetch user profile after login
      router.push('/chat'); // Redirect to chat page
    } finally {
      setLoading(false);
    }
  }, [loadUserFromToken, router]);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    try {
      await AuthService.register(username, email, password);
      // After successful registration, typically you'd redirect to login or auto-login
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    Cookies.remove('accessToken');
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/'); // Redirect to login page
  }, [router]);

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};