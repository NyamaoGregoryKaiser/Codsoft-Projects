// src/auth/authUtils.js
import Cookies from 'js-cookie';

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    const expiry = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch (e) {
    console.error("Error decoding JWT token:", e);
    return true; // Malformed token should be treated as expired
  }
};

export const getAuthUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
    return null;
  }
};

export const saveAuthData = (accessToken, refreshToken, userDetails) => {
  // Access token expiry in cookies is set to a short duration (e.g., 1 hour, or what backend JWT expiry dictates)
  // This is primarily for consistency, but the actual validation happens in the backend.
  // Secure: true should be used in production with HTTPS
  Cookies.set('accessToken', accessToken, { expires: 1 / 24, secure: true, sameSite: 'Strict' }); // 1 hour

  // Refresh token expiry should match backend's refresh token expiry (e.g., 7 days)
  Cookies.set('refreshToken', refreshToken, { expires: 7, secure: true, sameSite: 'Strict' });

  localStorage.setItem('user', JSON.stringify(userDetails));
};

export const clearAuthData = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  localStorage.removeItem('user');
};
```