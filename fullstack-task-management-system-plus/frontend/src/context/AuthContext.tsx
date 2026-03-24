import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthState, AuthContextType, UserToken } from '../types/auth';
import * as authService from '../services/auth.service';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token); // Use 'any' for jwt-decode's generic return
        if (decodedToken.exp * 1000 > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            user: {
                accessToken: token,
                tokenType: 'Bearer',
                role: decodedToken.role, // Assuming role is in token
                userId: decodedToken.userId, // Assuming userId is in token
                username: decodedToken.sub, // Assuming username is 'sub'
            },
            loading: false,
          });
        } else {
          localStorage.removeItem('accessToken');
          setAuthState({ ...initialState, loading: false });
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('accessToken');
        setAuthState({ ...initialState, loading: false });
      }
    } else {
      setAuthState({ ...initialState, loading: false });
    }
  }, []);

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const login = async (usernameOrEmail: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    try {
      const userData = await authService.login(usernameOrEmail, password);
      localStorage.setItem('accessToken', userData.accessToken);
      const decodedToken: any = jwtDecode(userData.accessToken);
      setAuthState({
        isAuthenticated: true,
        user: {
            accessToken: userData.accessToken,
            tokenType: 'Bearer',
            role: userData.role,
            userId: userData.userId,
            username: userData.username,
        },
        loading: false,
      });
    } catch (error) {
      setAuthState({ ...initialState, loading: false });
      throw error;
    }
  };

  const register = async (firstName: string, lastName: string, username: string, email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    try {
      const message = await authService.register(firstName, lastName, username, email, password);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return message;
    } catch (error) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAuthState({ ...initialState, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};