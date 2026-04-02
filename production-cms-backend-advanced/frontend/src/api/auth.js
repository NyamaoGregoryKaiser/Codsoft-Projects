import axios from './axiosConfig';
import { jwtDecode } from 'jwt-decode';

const AUTH_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const removeTokens = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const login = async (username, password) => {
    try {
        const response = await axios.post('/auth/login/', { username, password });
        setTokens(response.data.access, response.data.refresh);
        return jwtDecode(response.data.access); // Return decoded token for user info
    } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await axios.post('/register/', userData);
        return response.data;
    } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
        throw error;
    }
};

export const refreshToken = async () => {
    try {
        const refresh = getRefreshToken();
        if (!refresh) throw new Error("No refresh token available.");

        const response = await axios.post('/auth/token/refresh/', { refresh });
        setTokens(response.data.access, refresh); // Keep the old refresh token, or update if provided
        return response.data.access;
    } catch (error) {
        console.error("Token refresh error:", error.response?.data || error.message);
        removeTokens(); // Clear tokens on refresh failure
        throw error;
    }
};

export const isAuthenticated = () => {
    const token = getAccessToken();
    if (!token) return false;
    try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        return decoded.exp * 1000 > Date.now();
    } catch (error) {
        console.error("Invalid token:", error);
        return false;
    }
};

export const getUserInfo = () => {
    const token = getAccessToken();
    if (!token) return null;
    try {
        return jwtDecode(token);
    } catch (error) {
        return null;
    }
};