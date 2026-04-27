import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../src/components/auth/LoginForm';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'next/navigation'; // Mock Next.js router
import '@testing-library/jest-dom';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the useAuth hook to control its state and functions
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../src/contexts/AuthContext', () => ({
  ...jest.requireActual('../../src/contexts/AuthContext'), // Keep actual AuthProvider
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
  }),
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it('renders username and password fields and a login button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('allows typing into the input fields', () => {
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('calls the login function with correct credentials on submit', async () => {
    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpassword');
    });
  });

  it('displays an error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    }); // Simulate API error

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables the button while loading', async () => {
    // Make login return a promise that never resolves to keep it in loading state
    mockLogin.mockReturnValueOnce(new Promise(() => {}));

    render(<LoginForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'user' } });
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    fireEvent.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent(/logging in.../i);

    // If mockLogin would resolve, the button would re-enable
  });
});