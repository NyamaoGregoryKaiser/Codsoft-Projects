import axios from '../api/axiosInstance';
import { jwtDecode } from 'jwt-decode';

const register = async (username, email, password) => {
  try {
    const response = await axios.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

const login = async (username, password) => {
  try {
    const response = await axios.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
      return decodeToken(response.data.token);
    }
    return null;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('jwtToken');
  window.location.href = '/login'; // Redirect to login after logout
};

const getCurrentUser = () => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    return decodeToken(token);
  }
  return null;
};

const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return {
      username: decoded.sub, // 'sub' typically holds the subject (username)
      exp: decoded.exp,
      // Add other claims you might have in your JWT
    };
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

const checkTokenValidity = () => {
  const user = getCurrentUser();
  if (!user || !user.exp) {
    return false;
  }
  // Check if token is expired
  const currentTime = Date.now() / 1000; // Convert to seconds
  return user.exp > currentTime;
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  checkTokenValidity,
};

export default AuthService;