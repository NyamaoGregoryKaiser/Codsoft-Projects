import api from '../api/api';

const AUTH_URL = '/auth';

const register = async (username, email, password) => {
  try {
    const response = await api.post(`${AUTH_URL}/register`, {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const login = async (usernameOrEmail, password) => {
  try {
    const response = await api.post(`${AUTH_URL}/login`, {
      usernameOrEmail,
      password,
    });
    return response.data; // This should contain accessToken
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

const authService = {
  register,
  login,
};

export default authService;
```