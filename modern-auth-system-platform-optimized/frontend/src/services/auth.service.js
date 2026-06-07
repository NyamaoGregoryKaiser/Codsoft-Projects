```jsx
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode v4

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authorizedApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authorizedApi to add JWT token and handle refresh
authorizedApi.interceptors.request.use(
  async (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    let accessToken = user?.accessToken;
    let refreshToken = user?.refreshToken;

    if (accessToken) {
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000; // in seconds

      // If access token is expired, try to refresh
      if (decodedToken.exp < currentTime) {
        if (refreshToken) {
          try {
            const refreshResponse = await authApi.post('/auth/refresh-token', { refreshToken });
            const newAccessToken = refreshResponse.data.accessToken;
            const newRefreshToken = refreshResponse.data.refreshToken; // If refresh tokens rotate

            // Update user in localStorage
            localStorage.setItem('user', JSON.stringify({
              ...user,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            }));
            accessToken = newAccessToken; // Use new access token for current request
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // If refresh fails, log out the user
            localStorage.removeItem('user');
            window.location.href = '/login'; // Redirect to login page
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, log out
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(new Error('Refresh token missing.'));
        }
      }
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const register = (firstName, lastName, email, password) => {
  return authApi.post('/auth/register', {
    firstName,
    lastName,
    email,
    password,
  });
};

const login = (email, password) => {
  return authApi.post('/auth/login', {
    email,
    password,
  });
};

const logout = () => {
  localStorage.removeItem('user');
  // Optionally, if the backend has a logout endpoint to invalidate tokens
  // return authorizedApi.post('/auth/logout');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    try {
      const decodedToken = jwtDecode(user.accessToken);
      // Add roles directly to the user object for easy access
      user.roles = decodedToken.roles || []; // Assuming roles are in JWT claims
      user.email = decodedToken.sub; // Subject is typically the username/email
    } catch (e) {
      console.error("Error decoding token or token is invalid", e);
      logout(); // Invalidate corrupted token
      return null;
    }
    return user;
  }
  return null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  authorizedApi, // Export authorized API instance for other services
};

export default authService;
```