```javascript
import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance'; // Use the configured axios instance

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const parseToken = useCallback((token) => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      // Ensure the token is for an 'access' type and not expired
      if (decoded.exp * 1000 < Date.now() || decoded.type !== 'access') {
        return null;
      }
      return decoded;
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  }, []);

  const checkAuth = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken) {
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const decodedAccess = parseToken(accessToken);
    if (decodedAccess) {
      // Access token is valid
      setUser({ id: decodedAccess.sub, role: decodedAccess.role, email: decodedAccess.email }); // Assuming role and email are in token
      setIsAuthenticated(true);
      setIsAdmin(decodedAccess.role === 'admin');
    } else if (refreshToken) {
      // Access token invalid/expired, but refresh token exists.
      // The axios interceptor should handle the refresh automatically.
      // Here we just indicate that we might be authenticated or in a refresh process.
      // If the interceptor successfully refreshes, this component will re-render.
      console.log("Access token expired, relying on interceptor for refresh.");
      // We don't set user/isAuthenticated yet, assume loading until refresh completes or fails.
    } else {
      // No valid tokens, clear everything
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      console.log("No valid access or refresh token found. User not authenticated.");
    }
    setLoading(false);
  }, [parseToken]);

  useEffect(() => {
    checkAuth();

    // Set up interval to re-check auth periodically, or to pre-emptively refresh tokens
    const interval = setInterval(() => {
        // A more sophisticated approach might proactively refresh tokens here
        // if the access token is close to expiry, rather than waiting for 401.
        // For this example, we rely on the axios interceptor.
        // We can just re-run checkAuth to update state if tokens changed (e.g., after refresh)
        checkAuth();
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', new URLSearchParams({
        username: email,
        password: password
      }));
      const { access_token, refresh_token, expires_in } = response.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      const decoded = jwtDecode(access_token);
      setUser({ id: decoded.sub, role: decoded.role, email: decoded.email });
      setIsAuthenticated(true);
      setIsAdmin(decoded.role === 'admin');
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      setLoading(false);
      return { success: false, error: error.response?.data?.detail || "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Optionally call the backend logout endpoint if server-side invalidation is needed
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed on server:", error.response?.data || error.message);
      // Still proceed with client-side logout even if server call fails
    } finally {
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
      console.log("User logged out (client-side).");
    }
  }, []);

  // Public API of the hook
  return { user, isAuthenticated, isAdmin, loading, login, logout };
};

export default useAuth;
```