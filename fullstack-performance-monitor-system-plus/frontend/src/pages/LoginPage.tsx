import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/api-client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, data: { user } } = response.data;
      login(token, user);
      addToast('Logged in successfully!', 'success');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background px-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-text dark:text-dark-text">Login to AppInsight</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-danger text-center">{error}</div>}
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
            Log In
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-blue-600 dark:text-secondary dark:hover:text-blue-400">
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
```

```