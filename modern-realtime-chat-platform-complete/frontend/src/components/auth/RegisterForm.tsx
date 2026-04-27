import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void; // Callback to switch back to login form
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(username, email, password);
      onSuccess(); // Registration successful, switch to login form
      alert('Registration successful! Please log in.');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-gray-300">
          Username
        </label>
        <input
          type="text"
          id="reg-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="reg-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-300">
          Password
        </label>
        <input
          type="password"
          id="reg-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 p-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;