import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../contexts/AuthContext'; // Import the context
import '@testing-library/jest-dom';

// Mock AuthContext values
const mockLogin = jest.fn();
const mockAuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  register: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn(),
};

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));


describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
  });

  test('renders login form', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('heading', { name: /login to dataviz pro/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  test('allows entering email and password', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('calls login function on submit and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce({ user: { id: '1', email: 'test@example.com' }, token: 'abc' });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboards'));
  });

  test('displays error message on failed login', async () => {
    const errorMessage = 'Incorrect credentials';
    mockLogin.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText(errorMessage)).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays generic error message on network failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'any@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'anypass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument());
  });

  test('login button is disabled during submission', async () => {
    mockLogin.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100))); // Simulate delay

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <Router>
          <LoginPage />
        </Router>
      </AuthContext.Provider>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(loginButton).toHaveAttribute('aria-busy', 'true'); // Chakra UI button loading state
    expect(loginButton).toBeDisabled();

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
  });
});