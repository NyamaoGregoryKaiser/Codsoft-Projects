```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, AuthResponse } from '@/api/auth';
import { User } from '@/utils/types';
import { toast } from 'react-toastify';

interface AuthContextType {
  isAuthenticated: boolean;
  user: Omit<User, 'projects' | 'tasks'> | null;
  loading: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<Omit<User, 'projects' | 'tasks'> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await getUserProfile();
        setUser({ id: profile.id, username: profile.username, email: profile.email });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        toast.error('Session expired or invalid. Please log in again.');
        navigate('/login');
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = (authResponse: AuthResponse) => {
    localStorage.setItem('token', authResponse.token);
    setIsAuthenticated(true);
    setUser(authResponse.user);
    // Optionally refresh user profile to get full data if needed, but not strictly necessary here.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    setLoading(true);
    await loadUserFromToken();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```