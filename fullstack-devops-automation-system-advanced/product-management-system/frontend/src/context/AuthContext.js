import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true); // To manage initial authentication check

  // Function to refresh user data if token exists
  const fetchUserProfile = useCallback(async (authToken) => {
    try {
      const userData = await authService.getProfile(authToken);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // If fetching profile fails, token might be invalid/expired, log out
      logout();
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserProfile(storedToken);
    }
    setLoading(false); // Authentication check complete
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, userId } = response;
    localStorage.setItem('token', newToken);
    // Optionally, store userId as well, though `user` state might contain it
    setToken(newToken);
    // Fetch full user profile after login
    await fetchUserProfile(newToken);
    return userId;
  };

  const register = async (username, email, password) => {
    const response = await authService.register(username, email, password);
    // Registration doesn't automatically log in, redirect to login page
    return response.userId;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const contextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchUserProfile // Expose if other components need to trigger a refresh
  };

  if (loading) {
    // Optionally render a loading spinner or splash screen
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
```

```