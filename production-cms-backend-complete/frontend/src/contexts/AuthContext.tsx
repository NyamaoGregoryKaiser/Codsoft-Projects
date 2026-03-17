import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchCurrentUser } from '../api/authApi';
import { authRequest, authFailure, setUser } from '../store/authSlice';
import { User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const loadUser = async () => {
      if (token && !user) {
        dispatch(authRequest());
        try {
          const response = await fetchCurrentUser();
          if (response.success) {
            dispatch(setUser(response.data));
          } else {
            dispatch(authFailure(response.message || 'Failed to fetch user.'));
            navigate('/login');
          }
        } catch (err: any) {
          dispatch(authFailure(err.response?.data?.message || err.message || 'Failed to load user.'));
          navigate('/login');
        }
      } else if (!token && isAuthenticated) {
        // If isAuthenticated is true but token is missing (e.g., cleared manually)
        dispatch(authFailure('No token found. Please log in again.'));
        navigate('/login');
      }
    };

    loadUser();
  }, [token, user, isAuthenticated, dispatch, navigate]);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR || isAdmin;
  const isViewer = user?.role === UserRole.VIEWER || isEditor;


  const contextValue = {
    user,
    isAuthenticated,
    loading,
    error,
    isAdmin,
    isEditor,
    isViewer
  };

  return (
    <AuthContext.Provider value={contextValue}>
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