import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../api';
import { User, AuthTokens, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'role'> & { password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedTokens = localStorage.getItem('authTokens');

        if (storedUser && storedTokens) {
          const user = JSON.parse(storedUser) as User;
          const tokens = JSON.parse(storedTokens) as AuthTokens;
          setAuthState({ user, tokens, isAuthenticated: true, isLoading: false });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        logout(); // Clear potentially corrupted storage
      }
    };
    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post('/auth/login', { email, password });
    const { user, tokens } = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    setAuthState({ user, tokens, isAuthenticated: true, isLoading: false });
  };

  const register = async (userData: Omit<User, 'id' | 'role'> & { password: string }) => {
    const response = await axios.post('/auth/register', userData);
    const { user, tokens } = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    setAuthState({ user, tokens, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authTokens');
    setAuthState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
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