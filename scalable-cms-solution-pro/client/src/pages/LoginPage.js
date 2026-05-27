```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, authError, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    let success = false;
    if (isRegister) {
      success = await register(formData.username, formData.email, formData.password);
    } else {
      success = await login(formData.email, formData.password);
    }

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegister ? 'Register' : 'Login'}
        </h2>
        <AuthForm onSubmit={handleSubmit} isRegister={isRegister} loading={loading} error={authError} />
        <p className="mt-4 text-center">
          {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline ml-1"
            disabled={loading}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
```