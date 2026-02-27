import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    if (!username || !email || !password || !confirmPassword) {
      setFormError('All fields are required.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const { success, error } = await signUp({ username, email, password });

    if (success) {
      navigate('/projects');
    } else {
      setFormError(error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Register</h2>
      <form onSubmit={handleSubmit}>
        {formError && <div className="alert-error">{formError}</div>}
        <InputField
          label="Username"
          id="reg-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <InputField
          label="Email"
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputField
          label="Password"
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <InputField
          label="Confirm Password"
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full mt-4">
          {loading ? <Spinner size="sm" /> : 'Register'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
```
**`frontend/src/pages/ProjectListPage.js`**
```javascript