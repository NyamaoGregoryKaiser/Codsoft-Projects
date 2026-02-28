```jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct import path for jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; // in seconds
        if (decodedToken.exp < currentTime) {
          // Token expired, attempt to refresh or logout
          console.log('Token expired.');
          // In a real application, you'd try to use the refreshToken here.
          // For this example, we'll just log out.
          logout();
        } else {
          setIsAuthenticated(true);
          setUserRole(decodedToken.authorities ? decodedToken.authorities[0].authority : 'USER'); // Assuming Spring Security roles
          setUserId(decodedToken.id); // Assuming 'id' is in the JWT payload
          localStorage.setItem('jwtToken', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        logout();
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('refreshToken');
    }
  }, [token, refreshToken]);

  const login = (jwt, refreshJwt) => {
    setToken(jwt);
    setRefreshToken(refreshJwt);
    // JWT decoding and state updates handled by useEffect
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    // State updates handled by useEffect
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{
      token,
      refreshToken,
      isAuthenticated,
      userRole,
      userId,
      login,
      logout,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```