```javascript
import API from '../api/api';

const AUTH_URL = '/auth';

const register = async (username, email, password) => {
  try {
    const response = await API.post(`${AUTH_URL}/register`, { username, email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

const login = async (email, password) => {
  try {
    const response = await API.post(`${AUTH_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

const authService = {
  register,
  login,
};

export default authService;
```