import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import api from '../api/api';

function RegisterPage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Only checking isAuthenticated to redirect

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async ({ email, password }) => {
    setError(null);
    setIsLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      navigate('/login?registered=true'); // Redirect to login after successful registration
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <AuthForm
        type="register"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

export default RegisterPage;
```