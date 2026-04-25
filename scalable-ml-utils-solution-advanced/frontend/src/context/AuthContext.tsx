import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/api';
import { AuthResponse } from '../types/Auth';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  roles: string[];
  login: (token: string, username: string, roles: string[]) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const storedUsername = localStorage.getItem('username');
    const storedRoles = localStorage.getItem('roles');

    if (token && storedUsername && storedRoles) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setRoles(JSON.parse(storedRoles));
      // Optionally, validate token with backend here
    }
  }, []);

  const login = (token: string, user: string, userRoles: string[]) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('username', user);
    localStorage.setItem('roles', JSON.stringify(userRoles));
    setIsAuthenticated(true);
    setUsername(user);
    setRoles(userRoles);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    setIsAuthenticated(false);
    setUsername(null);
    setRoles([]);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const hasRole = (role: string) => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, roles, login, logout, hasRole }}>
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