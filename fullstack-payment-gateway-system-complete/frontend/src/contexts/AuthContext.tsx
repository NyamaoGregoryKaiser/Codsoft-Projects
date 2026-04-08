import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthResponse, LoginDto, RegisterDto, UserProfile, UserRole } from '@/types/auth';
import { loginUser, registerUser } from '@/api/auth';
import { useToast } from '@chakra-ui/react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<UserProfile>(token);
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setUser(decoded);
        } else {
          localStorage.removeItem('access_token');
        }
      } catch (error) {
        console.error('Failed to decode token or token is invalid:', error);
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginDto) => {
    try {
      const response: AuthResponse = await loginUser(credentials);
      localStorage.setItem('access_token', response.access_token);
      const decoded = jwtDecode<UserProfile>(response.access_token);
      setIsAuthenticated(true);
      setUser(decoded);
      toast({
        title: 'Login successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error; // Re-throw to allow component to handle form state
    }
  };

  const register = async (userData: RegisterDto) => {
    try {
      const response: AuthResponse = await registerUser(userData);
      localStorage.setItem('access_token', response.access_token);
      const decoded = jwtDecode<UserProfile>(response.access_token);
      setIsAuthenticated(true);
      setUser(decoded);
      toast({
        title: 'Registration successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
    toast({
      title: 'Logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout, hasRole }}>
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