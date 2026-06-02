import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      message.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm onFinish={handleLogin} error={error} loading={loading} />
  );
};

export default LoginPage;