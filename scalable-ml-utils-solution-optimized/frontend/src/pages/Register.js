```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register as apiRegister, login as apiLogin, getMe } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (username, email, password) => {
    setIsLoading(true);
    setError('');
    try {
      await apiRegister(username, email, password);
      
      // Automatically log in after successful registration
      const loginResponse = await apiLogin(email, password);
      const token = loginResponse.data.access_token;

      // Fetch user data after successful login
      const userResponse = await getMe();
      const userData = userResponse.data;

      authLogin(token, userData); // Update auth context
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      type="register"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Register;
```