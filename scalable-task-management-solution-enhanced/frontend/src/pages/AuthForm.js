import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const AuthForm = ({ type = 'login' }) => {
  const { login, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const isLogin = type === 'login';

  const validateForm = () => {
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    
    if (!isLogin) {
      if (!username) errors.username = 'Username is required';
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
      if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear global auth error
    if (!validateForm()) return;

    let success = false;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(username, email, password);
    }

    if (success) {
      if (isLogin) {
        navigate('/dashboard');
      } else {
        alert("Registration successful! Please log in.");
        navigate('/login');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {isLogin ? 'Welcome Back!' : 'Join TaskFlow'}
      </h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <Input
            label="Username"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            error={formErrors.username}
          />
        )}
        <Input
          label="Email address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          error={formErrors.email}
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          required
          error={formErrors.password}
        />
        {!isLogin && (
          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            required
            error={formErrors.confirmPassword}
          />
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="inline-block mr-2" /> : null}
          {isLogin ? 'Log In' : 'Register'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        {isLogin ? (
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark">
              Register here
            </Link>
          </p>
        ) : (
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              Log In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;