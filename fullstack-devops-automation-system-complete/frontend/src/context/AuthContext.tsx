```typescript
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthResponse, User } from '@types-frontend/entities'; // Use the User interface from entities

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Indicate if initial auth check is done

  const initializeAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        // Clear invalid data if parsing fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = (authResponse: AuthResponse) => {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    setIsAuthenticated(true);
    setUser(authResponse.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```