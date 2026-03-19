import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthResponse, LoginInput, RegisterInput } from '../types';
import api from '../api/axiosConfig';
import { saveAuthToken, getAuthToken, removeAuthToken, saveUser, getUserFromStorage, removeUser } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    const storedUser = getUserFromStorage();
    if (token && storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginInput) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      saveAuthToken(response.data.token);
      saveUser(response.data.user);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      removeAuthToken();
      removeUser();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterInput) => {
    try {
      await api.post<AuthResponse>('/auth/register', userData);
      // After registration, automatically log in the user
      await login({ email: userData.email, password: userData.password });
    } catch (error) {
      throw error;
    }
  }, [login]);

  const logout = useCallback(() => {
    removeAuthToken();
    removeUser();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
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