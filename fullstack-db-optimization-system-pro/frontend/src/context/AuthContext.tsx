import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { LoginForm, RegisterForm, User, Token } from '@types';
import { authApi } from '@api/auth';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@types/auth'; // Ensure this path is correct

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const setAuthData = useCallback((userData: User, tokenData: Token) => {
    Cookies.set('accessToken', tokenData.accessToken, { expires: 7, secure: import.meta.env.PROD }); // Token expires in 7 days
    setUser(userData);
    queryClient.setQueryData(['currentUser'], userData); // Update react-query cache
  }, [queryClient]);

  const removeAuthData = useCallback(() => {
    Cookies.remove('accessToken');
    setUser(null);
    queryClient.removeQueries({ queryKey: ['currentUser'], exact: true });
    queryClient.clear(); // Clear all cache on logout for security
  }, [queryClient]);

  const loadUser = useCallback(async () => {
    const token = Cookies.get('accessToken');
    if (token) {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user from token:', error);
        removeAuthData(); // Token might be invalid or expired
      }
    }
    setIsLoading(false);
  }, [removeAuthData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials: LoginForm) => {
    setIsLoading(true);
    try {
      const tokenResponse = await authApi.login(credentials);
      const currentUser = await authApi.getMe(); // Get full user details after successful login
      setAuthData(currentUser, tokenResponse);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    setIsLoading(true);
    try {
      const newUser = await authApi.register(userData);
      // After registration, automatically log in the user (optional, can redirect to login page)
      const tokenResponse = await authApi.login({ username: newUser.username, password: userData.password });
      setAuthData(newUser, tokenResponse);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthData();
    navigate('/login');
  };

  const isAuthenticated = !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};