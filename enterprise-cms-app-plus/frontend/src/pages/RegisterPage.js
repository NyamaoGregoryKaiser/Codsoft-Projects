```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { register } from '../api/auth';

function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (userData) => {
    setIsLoading(true);
    setError('');
    try {
      await register(userData);
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      const errors = err.response?.data;
      if (errors) {
        // Flatten error messages for display
        const errorMessages = Object.keys(errors)
          .map(key => `${key}: ${errors[key] instanceof Array ? errors[key].join(', ') : errors[key]}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <AuthForm type="register" onSubmit={handleRegister} isLoading={isLoading} error={error} />
    </div>
  );
}

export default RegisterPage;
```