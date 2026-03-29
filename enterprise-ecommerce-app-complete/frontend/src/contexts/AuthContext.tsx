```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((authData: AuthResponse) => {
    localStorage.setItem('jwt_token', authData.token);
    localStorage.setItem('user_data', JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
    toast.success('Logged in successfully!');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    toast('Logged out.', { icon: '👋' });
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      try {
        const updatedUser = await authApi.getMe();
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to refresh user data:', error);
        // If refresh fails, it might mean token is invalid/expired, so log out
        logout();
      }
    }
  }, [token, logout]);


  const value = React.useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    refreshUser,
  }), [user, token, loading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```