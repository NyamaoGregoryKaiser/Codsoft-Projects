```javascript
// This file centralizes auth logic for client-side
import { authApi } from './index';

const AuthService = {
  async register(userData) {
    try {
      const response = await authApi.register(userData);
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  async login(credentials) {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  async logout() {
    try {
      await authApi.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user'); // Clear user info if stored
      return true;
    } catch (error) {
      // Even if backend logout fails, clear local storage for UX
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      console.error('Logout failed on backend:', error);
      throw error.response?.data?.message || 'Logout failed';
    }
  },

  async getCurrentUser() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return null;
    }
    try {
      const response = await authApi.getCurrentUser();
      return response.data;
    } catch (error) {
      // Token might be expired or invalid, log out
      this.logout();
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};

export default AuthService;
```