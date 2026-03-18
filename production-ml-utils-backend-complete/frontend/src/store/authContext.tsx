import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthState, User, AuthContextType } from '../types/auth';
import { api } from '../utils/api';
import { AxiosError } from 'axios';
import { useToast } from '@chakra-ui/react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const toast = useToast();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading
  });

  const checkAuth = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token with backend, get user data
        const response = await api.get<{ status: string, data: User }>('/users/me');
        if (response.data.status === 'success') {
          setAuthState({
            user: response.data.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } else {
          // Token invalid or user not found
          logout();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        logout(); // Clear token on error
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    toast({
      title: "Login Successful",
      description: `Welcome, ${user.username}!`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, checkAuth }}>
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
```