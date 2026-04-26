```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import AuthForm from '../components/AuthForm';

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (email, password, fullName) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.post('/auth/register', { email, password, full_name: fullName });
      setSuccess('Registration successful! Please log in.');
      navigate('/login?registered=true');
    } catch (err) {
      console.error("Registration failed:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {success && <div className="alert alert-success">{success}</div>}
      <AuthForm type="register" onSubmit={handleRegister} isLoading={isLoading} errorMessage={error} />
    </div>
  );
};

export default Register;
```