```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState } from 'types';
import * as authService from './auth.service';
import { disconnectSocket } from 'api/socket';
import axiosInstance from 'api/axios';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const parsedUser: User = JSON.parse(user);
        setAuthState({
          user: parsedUser,
          token: token,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        logout(); // Clear invalid data
      }
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Axios interceptor to handle 401 globally within React context
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.log('Unauthorized request caught by context interceptor.');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    try {
      const { user, token } = await authService.login(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    try {
      await authService.register(username, email, password);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setAuthState({ user: null, token: null, isAuthenticated: false, loading: false });
    console.log('User logged out.');
  };

  const updateUser = (userData: Partial<User>) => {
    setAuthState(prevState => {
      if (prevState.user) {
        const updatedUser = { ...prevState.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { ...prevState, user: updatedUser };
      }
      return prevState;
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, updateUser }}>
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