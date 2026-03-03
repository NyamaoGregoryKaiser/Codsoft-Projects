import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../../contexts/AuthContext';
import api from '../../api/api';

// Mock the api.post call
jest.mock('../../api/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    api.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to dashboard on successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test' };
    const mockTokens = { access: { token: 'abc' }, refresh: { token: 'def' } };
    api.post.mockResolvedValueOnce({
      data: { user: mockUser, tokens: mockTokens },
    });

    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    expect(screen.queryByText(/Invalid credentials/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('user')).toEqual(JSON.stringify(mockUser));
    expect(localStorage.getItem('tokens')).toEqual(JSON.stringify(mockTokens));
  });

  it('disables button while logging in', async () => {
    api.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 500))); // Simulate delay

    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('button', { name: /logging in.../i })).toBeDisabled();
    await waitFor(() => expect(api.post).toHaveBeenCalled()); // Wait for the mock promise to resolve/reject
    expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
  });
});