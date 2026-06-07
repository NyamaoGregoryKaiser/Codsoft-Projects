```jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const storedUser = authService.getCurrentUser();
      setUser(storedUser);
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { accessToken, refreshToken } = response.data;
    const decodedToken = jwtDecode(accessToken);

    const userDetails = {
      accessToken,
      refreshToken,
      roles: decodedToken.roles || [], // Extract roles from token
      email: decodedToken.sub,        // Subject from token (email in our case)
      id: decodedToken.jti // Example: if UUID is stored in JTI
    };
    localStorage.setItem('user', JSON.stringify(userDetails));
    setUser(userDetails);
    return userDetails;
  };

  const register = async (firstName, lastName, email, password) => {
    const response = await authService.register(firstName, lastName, email, password);
    const { accessToken, refreshToken } = response.data;
    const decodedToken = jwtDecode(accessToken);

    const userDetails = {
      accessToken,
      refreshToken,
      roles: decodedToken.roles || [],
      email: decodedToken.sub,
      id: decodedToken.jti
    };
    localStorage.setItem('user', JSON.stringify(userDetails));
    setUser(userDetails);
    return userDetails;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
```