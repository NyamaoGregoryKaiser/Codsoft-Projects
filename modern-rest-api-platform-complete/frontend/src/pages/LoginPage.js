import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <AuthForm
        type="login"
        onSubmit={handleSubmit}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}

export default LoginPage;
```