```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async ({ email, password }) => {
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <AuthForm type="login" onSubmit={handleLogin} error={error} />
    </div>
  );
}

export default Login;
```