```tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, DecodedToken, CurrentUser } from '../types/auth';
import { login as apiLogin, register as apiRegister } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Initial loading for token check

  const decodeAndSetUser = useCallback((token: string) => {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000; // in seconds
      if (decoded.exp < currentTime) {
        console.warn("Token expired.");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
      const currentUser: CurrentUser = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };
      setUser(currentUser);
      setIsAuthenticated(true);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const decodedValid = decodeAndSetUser(token);
      if (decodedValid) {
        try {
          setUser(JSON.parse(storedUser)); // Set user from local storage if token is valid
        } catch (e) {
          console.error("Failed to parse stored user data", e);
          logout(); // Clear invalid data
        }
      }
    }
    setLoading(false);
  }, [decodeAndSetUser]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response: LoginResponse = await apiLogin(credentials);
      decodeAndSetUser(response.accessToken);
    } catch (error: any) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response: RegisterResponse = await apiRegister(userData);
      decodeAndSetUser(response.accessToken);
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout }}>
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