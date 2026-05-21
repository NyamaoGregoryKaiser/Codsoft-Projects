import api from './api';

export const loginUser = async (email, password) => {
  // FastAPI's OAuth2PasswordRequestForm expects username and password
  const response = await api.post('/auth/login', new URLSearchParams({
    username: email, // FastAPI uses 'username' for the email field in OAuth2 scheme
    password: password,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const registerUser = async (username, email, password) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  // For JWT, server-side logout is often not strictly necessary as tokens are stateless.
  // However, if there's a blacklist or session management on the backend, this could be used.
  // For this implementation, we just clear client-side token.
  // Example: await api.post('/auth/logout');
  return Promise.resolve();
};