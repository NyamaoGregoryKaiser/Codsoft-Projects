import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthContextType, User } from '../types';
import { authApi } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  exp: number; // Expiration timestamp
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedAccessToken) {
        try {
          const decoded: DecodedToken = jwtDecode(storedAccessToken);
          if (decoded.exp * 1000 > Date.now()) { // Token not expired
            setUser({ id: decoded.id, email: decoded.email, role: decoded.role as any, firstName: decoded.firstName, lastName: decoded.lastName });
            setAccessToken(storedAccessToken);
            setIsAuthenticated(true);
          } else if (storedRefreshToken) {
            await refreshAndSetToken(storedRefreshToken);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error decoding access token or token invalid:', error);
          if (storedRefreshToken) {
            await refreshAndSetToken(storedRefreshToken);
          } else {
            logout();
          }
        }
      } else if (storedRefreshToken) {
        await refreshAndSetToken(storedRefreshToken);
      } else {
        logout(); // No tokens, ensure logged out state
      }
      setLoading(false);
    };

    const refreshAndSetToken = async (refreshToken: string) => {
      try {
        const response = await authApi.refreshToken(refreshToken);
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        const decoded: DecodedToken = jwtDecode(newAccessToken);
        setUser({ id: decoded.id, email: decoded.email, role: decoded.role as any, firstName: decoded.firstName, lastName: decoded.lastName });
        setAccessToken(newAccessToken);
        setIsAuthenticated(true);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        logout();
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User, newAccessToken: string, newRefreshToken: string) => {
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    setUser(userData);
    setAccessToken(newAccessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    accessToken,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};