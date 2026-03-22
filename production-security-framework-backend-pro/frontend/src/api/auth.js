```javascript
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (accessToken) {
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000; // in seconds

      if (decodedToken.exp < currentTime) { // Access token expired
        if (refreshToken) {
          try {
            const newTokens = await refreshAccessToken(refreshToken);
            accessToken = newTokens.access_token;
            localStorage.setItem('access_token', accessToken);
            // If refresh token also got renewed, update it too
            if (newTokens.refresh_token) {
              localStorage.setItem('refresh_token', newTokens.refresh_token);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Force logout if refresh fails
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login'; // Redirect to login
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token available, force logout
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(new Error("No refresh token, access token expired."));
        }
      }
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to refresh access token
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  } catch (error) {
    console.error("Failed to refresh access token:", error.response?.data?.detail || error.message);
    throw error;
  }
}

export const register = async (email, password, full_name) => {
  const response = await apiClient.post('/auth/register', { email, password, full_name });
  return response.data;
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await apiClient.post('/auth/login', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const logout = async (accessToken) => {
  // We don't use apiClient here because it's configured with an interceptor
  // that might try to refresh an already invalidated token during logout.
  // Instead, use plain axios.
  const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const updateMe = async (userData) => {
  const response = await apiClient.put('/users/me', userData);
  return response.data;
};

export default apiClient; // Export apiClient for other services to use with interceptor
```