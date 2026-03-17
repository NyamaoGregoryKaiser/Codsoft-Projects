import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../api/authApi';
import { authRequest, authSuccess, authFailure } from '../store/authSlice';
import { RootState } from '../store/store';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); // Redirect if already authenticated
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
        return;
    }

    dispatch(authRequest());
    try {
      const response = await registerUser({ email, password });
      if (response.success) {
        dispatch(authSuccess(response.data));
        navigate('/dashboard');
      } else {
        dispatch(authFailure(response.message || 'Registration failed.'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (err.response?.data?.data ? err.response.data.data.join(', ') : err.message) || 'An unexpected error occurred.';
      dispatch(authFailure(errorMessage));
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Register for a new account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium leading-6 text-gray-900">
              Confirm Password
            </label>
            <div className="mt-2">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
              />
            </div>
            {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Already a member?{' '}
          <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Sign in to your account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;