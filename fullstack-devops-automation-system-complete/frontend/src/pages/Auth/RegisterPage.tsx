```typescript
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@components/Common/Input';
import Button from '@components/Common/Button';
import { registerUser } from '@api/user';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // For registration via frontend, we typically register as USER role
      // If an admin wants to register another admin, it would be via an admin panel route.
      await registerUser({ username, email, password, role: 'USER' });
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Register</h2>
      <form onSubmit={handleSubmit}>
        <Input
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
          placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special"
        />
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="form-link">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
```