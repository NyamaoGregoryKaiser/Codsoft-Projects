```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authApi from '../../api/auth';

// Mock the authApi login function
jest.mock('../../api/auth', () => ({
  login: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    authApi.login.mockReset();
    mockNavigate.mockReset();
    localStorage.clear(); // Clear local storage before each test
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login form with email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    authApi.login.mockRejectedValue({ detail: 'Invalid credentials' });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to dashboard on successful login', async () => {
    authApi.login.mockResolvedValue({ access_token: 'fake-access-token' });
    // Mock getCurrentUser for AuthContext's loadUserFromToken
    jest.mock('../../api/user', () => ({
      getCurrentUser: jest.fn(() => Promise.resolve({ email: 'test@example.com', first_name: 'Test' })),
    }));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'testpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'testpassword');
      expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows loading state during login', async () => {
    authApi.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ access_token: 'token' }), 100)));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'testpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /logging in.../i })).toBeDisabled();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });
});
```