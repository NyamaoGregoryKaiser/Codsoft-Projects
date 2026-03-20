import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';

const RegisterPage: React.FC = () => {
  const { register, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (email: string, password: string) => {
    setError(null);
    try {
      await register(email, password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed.';
      setError(errorMessage.includes('Validation failed') ? errorMessage : 'Registration failed. Email might be in use or password invalid.');
    }
  };

  return (
    <>
      <AuthForm type="register" onSubmit={handleRegister} loading={loading} error={error} />
      <p className="switch-auth-mode">
        Already have an account? <Link to="/login"><button type="button">Login here</button></Link>
      </p>
    </>
  );
};

export default RegisterPage;