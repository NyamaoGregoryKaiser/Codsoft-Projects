import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../types';
import { fetchMe } from '../api/auth';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded: { id: string, exp: number } = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            // Token expired
            logout();
            return;
          }
          const fetchedUser = await fetchMe();
          setUser(fetchedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to fetch user or decode token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded: { id: string } = jwtDecode(token);
    // Fetch user details to get complete user object
    fetchMe().then(fetchedUser => {
      setUser(fetchedUser);
      setIsAuthenticated(true);
    }).catch(error => {
      console.error('Failed to fetch user after login:', error);
      logout();
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
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