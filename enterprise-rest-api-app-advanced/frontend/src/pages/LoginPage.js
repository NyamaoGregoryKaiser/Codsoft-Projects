import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    if (!username || !password) {
      setFormError('Please enter both username and password.');
      setLoading(false);
      return;
    }

    const { success, error } = await signIn(username, password);

    if (success) {
      navigate('/projects');
    } else {
      setFormError(error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Login</h2>
      <form onSubmit={handleSubmit}>
        {formError && <div className="alert-error">{formError}</div>}
        <InputField
          label="Username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <InputField
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full mt-4">
          {loading ? <Spinner size="sm" /> : 'Login'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
```
**`frontend/src/pages/RegisterPage.js`**
```javascript