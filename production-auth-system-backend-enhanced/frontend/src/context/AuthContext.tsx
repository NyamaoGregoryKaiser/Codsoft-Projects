import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContextType, User } from '../types/auth';
import { getAccessToken, setAccessToken, removeAccessToken, getUser, setUser, removeUser } from '../utils/localStorage';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Initial loading state
  const navigate = useNavigate();

  // Function to initialize auth state from local storage
  const initializeAuthState = useCallback(() => {
    const storedAccessToken = getAccessToken();
    const storedUser = getUser<User>();

    if (storedAccessToken && storedUser) {
      setAccessTokenState(storedAccessToken);
      setUserState(storedUser);
      api.defaults.headers.common.Authorization = `Bearer ${storedAccessToken}`;
    } else {
      removeAccessToken();
      removeUser();
      setAccessTokenState(null);
      setUserState(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeAuthState();
  }, [initializeAuthState]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: newAccessToken, user: userData } = response.data.data;
      
      setAccessToken(newAccessToken);
      setUser(userData);
      
      setAccessTokenState(newAccessToken);
      setUserState(userData);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`; // Update axios header

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password });
      const { accessToken: newAccessToken, user: userData } = response.data.data;

      setAccessToken(newAccessToken);
      setUser(userData);

      setAccessTokenState(newAccessToken);
      setUserState(userData);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`; // Update axios header

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout'); // Backend handles clearing cookie
    } catch (error) {
      console.error('Logout failed on server:', error);
      // Even if server fails to clear token, clear client-side state
    } finally {
      removeAccessToken();
      removeUser();
      setAccessTokenState(null);
      setUserState(null);
      delete api.defaults.headers.common.Authorization; // Remove token from axios header
      setLoading(false);
      navigate('/login');
    }
  };

  const getProfile = async (): Promise<User | null> => {
    if (!accessToken) return null;
    try {
      const response = await api.get('/auth/profile');
      const profileData: User = response.data.data;
      setUser(profileData); // Update local storage with fresh profile data
      setUserState(profileData); // Update state
      return profileData;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // If fetching profile fails (e.g., token expired), it will be handled by interceptor
      return null;
    }
  };

  const isAuthenticated = !!user && !!accessToken;

  const contextValue: AuthContextType = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    getProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};