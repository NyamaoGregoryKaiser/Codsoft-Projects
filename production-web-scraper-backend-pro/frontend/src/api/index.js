```javascript
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import moment from 'moment';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = moment().unix();

      // Check if token is expired (giving a small buffer)
      if (decodedToken.exp < currentTime + 60) { // If less than 60 seconds to expire
        console.warn("Access token expired or about to expire. User needs to re-login.");
        // In a real app, you might try to refresh the token using a refresh token
        // For simplicity, we'll just log out here or let the subsequent API call fail
        localStorage.removeItem('accessToken');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject(new Error("Access token expired. Please log in again."));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized: Token might be invalid or missing. Redirecting to login.");
      localStorage.removeItem('accessToken');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;
```