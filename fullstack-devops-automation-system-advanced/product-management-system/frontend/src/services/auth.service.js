import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

const authService = {
  /**
   * Register a new user.
   * @param {string} username
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Response data
   */
  register: async (username, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username,
      email,
      password
    });
    return response.data;
  },

  /**
   * Log in a user.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Response data containing token and userId
   */
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  /**
   * Get user profile.
   * @param {string} token
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async (token) => {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export { authService };
```

```