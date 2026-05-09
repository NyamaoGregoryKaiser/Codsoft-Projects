import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';
import apiClient from '../api/apiClient'; // Mock this

// Mock the apiClient for network requests
jest.mock('../api/apiClient');

// Mock react-router-dom's useNavigate for navigation testing
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    apiClient.post.mockClear();
    mockedUsedNavigate.mockClear();
  });

  test('renders login form with email and password fields', () => {
    render(
      <Router>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </Router>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('submits login form successfully and navigates to dashboard', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        user: { id: 1, email: 'test@example.com', full_name: 'Test User', roles: [{ name: 'user' }] }
      }
    });

    render(
      <Router>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
      expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('fake-refresh-token');
    });
  });

  test('displays error message on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    apiClient.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } }
    });

    render(
      <Router>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  test('shows loading spinner during submission', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        user: { id: 1, email: 'test@example.com', full_name: 'Test User', roles: [{ name: 'user' }] }
      }
    });

    render(
      <Router>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /login/i }).querySelector('.spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /login/i }).querySelector('.spinner')).not.toBeInTheDocument();
    });
  });

  test('links to register page and forgot password page are present', () => {
    render(
      <Router>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </Router>
    );

    expect(screen.getByRole('link', { name: /don't have an account\? register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password\?/i })).toBeInTheDocument();
  });
});
```