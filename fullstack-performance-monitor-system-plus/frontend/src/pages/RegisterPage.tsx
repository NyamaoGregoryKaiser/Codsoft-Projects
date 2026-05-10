import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/api-client';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const { addToast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    if (name.length < 3) newErrors.name = 'Name must be at least 3 characters long.';
    if (!email.includes('@') || !email.includes('.')) newErrors.email = 'Invalid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long.';
    if (password !== passwordConfirm) newErrors.passwordConfirm = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.values(newErrors).every(err => err === null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      await apiClient.post('/auth/register', { name, email, password, passwordConfirm });
      addToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      addToast(errorMessage, 'error');
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background px-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-text dark:text-dark-text">Register for AppInsight</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && <div className="text-danger text-center">{errors.general}</div>}
          <Input
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            error={errors.name}
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            error={errors.email}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            id="passwordConfirm"
            label="Confirm Password"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            autoComplete="new-password"
            error={errors.passwordConfirm}
          />
          <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
            Register
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-blue-600 dark:text-secondary dark:hover:text-blue-400">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
```

```