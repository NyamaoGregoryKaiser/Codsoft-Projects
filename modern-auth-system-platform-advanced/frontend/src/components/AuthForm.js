'use client';

import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../app/layout'; // Access AuthContext

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { login: handleLoginSuccessInContext } = useAuth(); // Get login handler from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (username.length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      let response;
      if (isRegistering) {
        response = await api.register(username, password);
        setMessage(response.message + " Please log in.");
        setIsRegistering(false); // Switch to login form after successful registration
      } else {
        response = await api.login(username, password);
        setMessage(response.message);
        handleLoginSuccessInContext(); // Update global auth state
      }
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.message || err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        {isRegistering ? 'Register' : 'Login'}
      </h2>

      {message && <p className="mb-4 text-green-600 text-center">{message}</p>}
      {error && <p className="mb-4 text-red-600 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
            Username:
          </label>
          <input
            type="text"
            id="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {isRegistering && (
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setMessage('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### `frontend/src/app/globals.css`
```css