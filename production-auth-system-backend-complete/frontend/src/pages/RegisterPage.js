import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import apiClient from '../api/apiClient';

function RegisterPage() {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async ({ email, password, full_name }) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await apiClient.post('/auth/register', { email, password, full_name });
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      // Optionally redirect after a delay, or show a link to login
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Register</h2>
      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      <AuthForm
        type="register"
        onSubmit={handleRegister}
        isLoading={isLoading}
      />
    </div>
  );
}

export default RegisterPage;
```