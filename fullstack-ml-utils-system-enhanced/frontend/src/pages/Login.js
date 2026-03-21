```javascript
import React from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loading } = useAuth();

  const handleLogin = async (email, password) => {
    await login(email, password);
  };

  return (
    <AuthForm type="login" onSubmit={handleLogin} isLoading={loading} />
  );
};

export default Login;
```