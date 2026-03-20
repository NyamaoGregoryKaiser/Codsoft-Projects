import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';
import api from '../api'; // For forgot password

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
      // Message handled by AuthForm itself
    } catch (err: any) {
      throw err; // Re-throw to be caught by AuthForm
    }
  };

  return (
    <>
      <AuthForm type="login" onSubmit={handleLogin} onForgotPassword={handleForgotPassword} loading={loading} error={error} />
      <p className="switch-auth-mode">
        Don't have an account? <Link to="/register"><button type="button">Register here</button></Link>
      </p>
    </>
  );
};

export default LoginPage;