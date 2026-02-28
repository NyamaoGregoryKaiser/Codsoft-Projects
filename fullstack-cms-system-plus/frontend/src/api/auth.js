```jsx
import api from './index';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/authenticate', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};
```