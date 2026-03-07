```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthPage from '../pages/Auth';
import { AuthProvider } from '../contexts/AuthContext';
import * as authApi from '../api/auth';

// Mock authApi for testing
jest.mock('../api/auth');

// Helper to render AuthPage within AuthProvider
const renderAuthPage = () => {
  return render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
};

describe('AuthPage', () => {
  beforeEach(() => {
    // Clear mocks before each test
    authApi.login.mockReset();
    authApi.register.mockReset();
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders login form by default', () => {
    renderAuthPage();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });

  test('switches to register form when "Register here" is clicked', () => {
    renderAuthPage();
    fireEvent.click(screen.getByText(/register here/i));
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    authApi.login.mockResolvedValueOnce({
      data: {
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'user' },
        tokens: { access: { token: 'abc', expires: '2025-01-01' }, refresh: { token: 'def', expires: '2025-01-31' } }
      }
    });

    renderAuthPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      // In a real app, this would redirect, which is mocked by useNavigate in setupTests.js
      // For now, we check localStorage
      expect(localStorage.getItem('user')).toBeDefined();
      expect(localStorage.getItem('tokens')).toBeDefined();
    });
  });

  test('displays error message on failed login', async () => {
    authApi.login.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });

    renderAuthPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('handles successful registration', async () => {
    authApi.register.mockResolvedValueOnce({
      data: {
        user: { id: '2', name: 'New User', email: 'new@example.com', role: 'user' },
        tokens: { access: { token: 'ghi', expires: '2025-01-01' }, refresh: { token: 'jkl', expires: '2025-01-31' } }
      }
    });

    renderAuthPage();
    fireEvent.click(screen.getByText(/register here/i)); // Switch to register form

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({ name: 'New User', email: 'new@example.com', password: 'newpassword123' });
      expect(localStorage.getItem('user')).toBeDefined();
      expect(localStorage.getItem('tokens')).toBeDefined();
    });
  });

  test('displays password validation error on registration', async () => {
    renderAuthPage();
    fireEvent.click(screen.getByText(/register here/i)); // Switch to register form

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Short Pass User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'short@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } }); // Invalid password
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long and contain at least one letter and one number/i)).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled(); // API call should not be made
    });
  });
});
```