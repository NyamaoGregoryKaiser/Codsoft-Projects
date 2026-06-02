import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await register(values);
      message.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      message.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterForm onFinish={handleRegister} error={error} loading={loading} />
  );
};

export default RegisterPage;