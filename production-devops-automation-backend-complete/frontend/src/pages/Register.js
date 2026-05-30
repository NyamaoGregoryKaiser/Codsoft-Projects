```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleRegister = async ({ username, email, password }) => {
    setError('');
    const result = await register(username, email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <AuthForm type="register" onSubmit={handleRegister} error={error} />
    </div>
  );
}

export default Register;
```