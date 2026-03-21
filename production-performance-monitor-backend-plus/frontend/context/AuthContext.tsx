"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthenticatedUser } from "@/types";
import { api } from "@/utils/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeAccessToken = (token: string): AuthenticatedUser | null => {
    try {
      const decoded: any = jwtDecode(token);
      return {
        id: decoded.user_id,
        email: decoded.email,
        is_admin: decoded.is_admin,
      };
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const getAndSetUser = useCallback(async (accessToken: string) => {
    const decodedUser = decodeAccessToken(accessToken);
    if (decodedUser) {
      setUser(decodedUser);
      api.setAuthToken(accessToken);
    } else {
      // If token is invalid, clear storage
      Cookies.remove("refresh_token");
      api.setAuthToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) {
      console.log("No refresh token found.");
      return null;
    }
    try {
      const response = await api.post("/api/v1/auth/refresh", {}); // Refresh token is sent via cookie
      const { access_token } = response.data;
      api.setAuthToken(access_token);
      getAndSetUser(access_token);
      return access_token;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      Cookies.remove("refresh_token");
      api.setAuthToken(null);
      setUser(null);
      return null;
    }
  }, [getAndSetUser]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = api.getAuthToken();
      if (storedAccessToken) {
        const decoded: any = jwtDecode(storedAccessToken);
        // Check if token is expired (giving a buffer for network latency)
        if (decoded.exp * 1000 > Date.now() + 10000) { // If token expires in > 10 seconds
          await getAndSetUser(storedAccessToken);
        } else {
          console.log("Access token expired, attempting to refresh...");
          await refreshAccessToken();
        }
      } else {
        await refreshAccessToken(); // Try to refresh if no access token is stored but a refresh token might exist
        setLoading(false); // If no access token and refresh fails, then we are not authenticated
      }
    };

    initializeAuth();

    // Set up an interval to refresh the token periodically (e.g., every 5 minutes)
    const refreshInterval = setInterval(async () => {
        if (api.getAuthToken() && Cookies.get("refresh_token")) {
            console.log("Attempting periodic token refresh...");
            await refreshAccessToken();
        }
    }, (settings.ACCESS_TOKEN_EXPIRE_MINUTES - 5) * 60 * 1000); // refresh 5 mins before access token expires

    return () => clearInterval(refreshInterval);
  }, [getAndSetUser, refreshAccessToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/api/v1/auth/token", {
        username: email,
        password: password,
      }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' // FastAPI expects form data
        }
      });
      const { access_token } = response.data;
      api.setAuthToken(access_token);
      await getAndSetUser(access_token);
    } catch (error: any) {
      console.error("Login failed:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Login failed");
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await api.post("/api/v1/auth/register", { email, password });
      // After registration, directly log in the user
      await login(email, password);
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } finally {
      api.setAuthToken(null);
      Cookies.remove("refresh_token");
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Dummy settings for frontend context (should align with backend config for token expiry)
const settings = {
    ACCESS_TOKEN_EXPIRE_MINUTES: 30, // Example value, align with backend
    // Other settings if needed
};