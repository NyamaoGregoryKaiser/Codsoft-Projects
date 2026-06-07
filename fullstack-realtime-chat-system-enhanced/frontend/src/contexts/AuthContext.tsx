```typescript
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, setAccessToken, removeAccessToken, getStoredUser, setStoredUser, removeStoredUser } from '../utils/localStorage';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from '../api/auth';
import { User, Token, UserCreate } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      // Try to validate token and fetch user info
      try {
        const fetchedUser = await apiGetMe();
        setUser(fetchedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to validate token or fetch user info:', error);
        logout(); // Clear invalid token/user
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const token: Token = await apiLogin(username, password);
      setAccessToken(token.access_token);
      const fetchedUser = await apiGetMe();
      setUser(fetchedUser);
      setStoredUser(fetchedUser);
      setIsAuthenticated(true);
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error; // Re-throw to be handled by the form component
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (userData: UserCreate) => {
    setIsLoading(true);
    try {
      await apiRegister(userData);
      // Optionally log in the user directly after registration
      await login(userData.username, userData.password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error; // Re-throw to be handled by the form component
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    removeAccessToken();
    removeStoredUser();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
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