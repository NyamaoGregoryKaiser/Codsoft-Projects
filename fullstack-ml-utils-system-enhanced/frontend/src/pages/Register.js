```javascript
import React from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, loading } = useAuth();

  const handleRegister = async (email, password) => {
    await register(email, password);
  };

  return (
    <AuthForm type="register" onSubmit={handleRegister} isLoading={loading} />
  );
};

export default Register;
```