import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, AuthPayload, RegisterPayload, UserRole } from '../types/auth';
import * as authService from '../api/authService';
import { setAuthToken } from '../api/taskService'; // To update axios instance with token

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: AuthPayload) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial check

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setAuthToken(storedToken);
          const userData = await authService.getMe(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user from storage or validate token:', error);
        localStorage.removeItem('token');
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserFromStorage();
  }, []);

  const handleAuthResponse = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const login = async (credentials: AuthPayload) => {
    const data = await authService.login(credentials);
    handleAuthResponse(data);
  };

  const register = async (userData: RegisterPayload) => {
    const data = await authService.register(userData);
    handleAuthResponse(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};