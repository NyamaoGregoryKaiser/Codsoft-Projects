```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async ({ username, password }) => {
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboards');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex justify-center items-center mt-10">
      <AuthForm type="login" onSubmit={handleSubmit} error={error} />
    </div>
  );
};

export default LoginPage;
```