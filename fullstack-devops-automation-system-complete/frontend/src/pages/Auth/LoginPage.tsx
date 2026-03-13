```typescript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@components/Common/Input';
import Button from '@components/Common/Button';
import { loginUser } from '@api/user';
import useAuth from '@hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      login(response);
      navigate('/products'); // Redirect to products page after successful login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="alert alert-error">{error}</div>}
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="form-link">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
```