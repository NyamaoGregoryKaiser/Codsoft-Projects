```javascript
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import API from '../api/api';
import authService from '../services/authService';

// Mock API and authService
jest.mock('../api/api');
jest.mock('../services/authService');

const TestComponent = () => {
  const { isAuthenticated, user, loading, authError, login, logout, register } = React.useContext(AuthContext);

  if (loading) return <div>Loading Auth...</div>;

  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
      {user && <span data-testid="username">{user.username}</span>}
      {authError && <span data-testid="auth-error">{authError}</span>}
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register('newuser', 'new@example.com', 'pass123')}>Register</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    API.get.mockResolvedValue({ data: { data: { _id: '1', username: 'TestUser', email: 'test@example.com' } } });
    authService.login.mockResolvedValue({ token: 'mocktoken', user: { _id: '1', username: 'TestUser', email: 'test@example.com' } });
    authService.register.mockResolvedValue({ token: 'mocktoken', user: { _id: '2', username: 'NewUser', email: 'new@example.com' } });
  });

  it('should be loading initially and then set authentication status', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading Auth...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
  });

  it('should authenticate user if token exists in localStorage', async () => {
    localStorage.setItem('token', 'valid_token');
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('TestUser');
    });
    expect(API.get).toHaveBeenCalledWith('/auth/me');
  });

  it('should handle successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('TestUser');
    });
    expect(localStorage.getItem('token')).toBe('mocktoken');
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should handle successful registration', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Register'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('NewUser');
    });
    expect(localStorage.getItem('token')).toBe('mocktoken');
    expect(authService.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'pass123');
  });


  it('should handle logout', async () => {
    localStorage.setItem('token', 'valid_token');
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated'));

    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.queryByTestId('username')).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should set authError on login failure', async () => {
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid credentials');
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('should remove token and set unauthenticated if /auth/me fails', async () => {
    localStorage.setItem('token', 'invalid_token');
    API.get.mockRejectedValueOnce(new Error('Unauthorized')); // Mock an API error

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});
```