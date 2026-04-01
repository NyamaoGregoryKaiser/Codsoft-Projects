```javascript
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';

const AuthForm = ({ type, onSubmit, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'login') {
      onSubmit(email, password);
    } else {
      onSubmit(username, email, password);
    }
  };

  const isLogin = type === 'login';

  return (
    <Card title={isLogin ? 'Login' : 'Register'} className="max-w-md mx-auto mt-10">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <div>
          <button type="submit" className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </div>
      </form>
      <div className="mt-6 text-center text-sm">
        {isLogin ? (
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Login here
            </Link>
          </p>
        )}
      </div>
    </Card>
  );
};

export default AuthForm;
```