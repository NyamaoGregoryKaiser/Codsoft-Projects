```typescript jsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { loginUser, LoginRequest, LoginResponse } from '../api/api';
import { deleteToken, getToken, setToken, decodeToken } from '../utils/auth';

interface User {
  username: string;
  role: string;
  id: string; // From JWT payload
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // To manage initial token check

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const decoded = decodeToken(token);
          if (decoded && decoded.exp * 1000 > Date.now()) { // Check if token is not expired
            setUser({ username: decoded.sub, role: decoded.role, id: decoded.jti });
            setIsAuthenticated(true);
          } else {
            deleteToken(); // Token expired
            console.warn("Token expired. Logging out.");
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          deleteToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response: LoginResponse = await loginUser(credentials);
      setToken(response.token);
      const decoded = decodeToken(response.token);
      if (decoded) {
        setUser({ username: decoded.sub, role: decoded.role, id: decoded.jti });
        setIsAuthenticated(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    deleteToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
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