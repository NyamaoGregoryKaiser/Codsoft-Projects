import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to attach token if available
instance.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration/refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error status is 401 (Unauthorized) and it's not a login/register request
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/register') {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refreshToken');

      if (refreshToken) {
        try {
          const res = await instance.post('/auth/refresh-tokens', { refreshToken });
          const { accessToken, expires: accessExpires } = res.data.data.tokens.access;
          const { token: newRefreshToken, expires: refreshExpires } = res.data.data.tokens.refresh;

          Cookies.set('accessToken', accessToken, { expires: new Date(accessExpires) });
          Cookies.set('refreshToken', newRefreshToken, { expires: new Date(refreshExpires) });

          setAuthToken(accessToken);
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return instance(originalRequest); // Retry the original request with new token
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          // Force logout if refresh fails
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          setAuthToken(null);
          window.location.href = '/login'; // Redirect to login
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, force logout
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setAuthToken(null);
        window.location.href = '/login'; // Redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default instance;