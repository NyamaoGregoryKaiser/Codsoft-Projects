```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, getMe } from '../api/api';
import AuthForm from '../components/AuthForm';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (email, password) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiLogin(email, password);
      const token = response.data.access_token;
      
      // Fetch user data after successful login to store in context
      const userResponse = await getMe();
      const userData = userResponse.data;

      authLogin(token, userData); // Update auth context
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      type="login"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Login;
```