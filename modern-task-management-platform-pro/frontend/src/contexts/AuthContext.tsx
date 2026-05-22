```typescript
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { User, ApiResponse } from 'types';
import * as authApi from 'api/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res: ApiResponse<User> = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch user data or unauthorized:', error.response?.data?.message || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (payload: { email: string; password: string }) => {
    try {
      setLoading(true);
      const res: ApiResponse<User> = await authApi.login(payload);
      if (res.success && res.data) {
        setUser(res.data);
        navigate('/dashboard');
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } catch (error: any) {
      setUser(null);
      throw error; // Re-throw to allow component to handle specific error messages
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      setLoading(true);
      const res: ApiResponse<User> = await authApi.register(payload);
      if (res.success && res.data) {
        setUser(res.data);
        navigate('/dashboard');
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (error: any) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local user state for UX
      setUser(null);
      navigate('/login');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, checkAuth }}>
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
```