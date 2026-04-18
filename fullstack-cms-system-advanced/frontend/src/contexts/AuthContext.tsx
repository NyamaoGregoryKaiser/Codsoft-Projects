import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthTokens, User } from '../types';
import { loginUser, getAuthenticatedUser } from '../api/auth.api';
import { LoginDto } from '../types';
import axiosInstance from '../api/axiosInstance'; // For global axios header cleanup

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const tokens = localStorage.getItem('authTokens');
      if (tokens) {
        try {
          const { accessToken } = JSON.parse(tokens) as AuthTokens;
          const decodedToken: { exp: number } = jwtDecode(accessToken);
          if (decodedToken.exp * 1000 > Date.now()) { // Token not expired
            const fetchedUser = await getAuthenticatedUser();
            setUser(fetchedUser);
          } else {
            // Token expired, let interceptor handle refresh or logout
            console.log('Access token expired, interceptor should handle refresh or redirect.');
            localStorage.removeItem('authTokens'); // Clear if refresh also failed
          }
        } catch (error) {
          console.error('Failed to load user from token:', error);
          localStorage.removeItem('authTokens');
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const handleLogin = async (credentials: LoginDto) => {
    setLoading(true);
    try {
      const { tokens, user: loggedInUser } = await loginUser(credentials);
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authTokens');
    setUser(null);
    delete axiosInstance.defaults.headers.common['Authorization']; // Clean up
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role.name === 'admin';
  const isEditor = user?.role.name === 'editor';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isEditor, login: handleLogin, logout: handleLogout, loading }}>
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