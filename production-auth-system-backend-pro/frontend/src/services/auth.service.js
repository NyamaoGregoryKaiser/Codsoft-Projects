```javascript
import api from './api';

const AUTH_URL = '/auth';

const register = async (firstName, lastName, email, password) => {
  try {
    const response = await api.post(`${AUTH_URL}/register`, {
      firstName,
      lastName,
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.userEmail,
        role: response.data.role,
      }));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const login = async (email, password) => {
  try {
    const response = await api.post(`${AUTH_URL}/login`, {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.userEmail,
        role: response.data.role,
      }));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

const logout = () => {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const getToken = () => {
  return localStorage.getItem('jwtToken');
}

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
};

export default authService;
```