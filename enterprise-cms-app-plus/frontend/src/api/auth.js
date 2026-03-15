```javascript
import api from './axiosInstance';

const AUTH_BASE_URL = '/api/v1/auth';

export const register = (userData) => api.post(`${AUTH_BASE_URL}/register/`, userData);
export const login = (credentials) => api.post(`${AUTH_BASE_URL}/token/`, credentials);
export const refreshToken = (refresh) => api.post(`${AUTH_BASE_URL}/token/refresh/`, { refresh });
export const verifyToken = (token) => api.post(`${AUTH_BASE_URL}/token/verify/`, { token });
export const getProfile = () => api.get(`${AUTH_BASE_URL}/me/`);
export const updateProfile = (profileData) => api.patch(`${AUTH_BASE_URL}/me/`, profileData);
```