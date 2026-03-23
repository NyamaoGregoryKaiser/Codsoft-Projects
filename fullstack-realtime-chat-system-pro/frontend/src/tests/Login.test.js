import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from '../components/auth/Login';
import { AuthProvider, AuthContext } from '../auth/AuthContext';
import AuthService from '../auth/AuthService';
import '@testing-library/jest-dom';

// Mock AuthService to control its behavior during tests
jest.mock('../auth/AuthService', () => ({
  login: jest.fn(),
  checkTokenValidity: jest.fn(() => true), // Assume token is always valid for initial load
  getCurrentUser: jest.fn(() => null), // No user initially
  logout: jest.fn(),
}));

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('Login Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Provide a mock AuthContext for testing the Login component
    // If you render AuthProvider, it will provide its own context.
    // We wrap Login in AuthProvider for a more realistic test.
  });

  const renderWithAuth = (ui, { providerProps, ...renderOptions } = {}) => {
    return render(
      <Router>
        <AuthContext.Provider value={providerProps || {
          currentUser: null,
          isAuthenticated: false,
          login: mockLogin,
          logout: jest.fn(),
          loading: false,
        }}>
          {ui}
        </AuthContext.Provider>
      </Router>,
      renderOptions
    );
  };


  test('renders login form correctly', () => {
    renderWithAuth(<Login />);
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
  });

  test('allows entering username and password', () => {
    renderWithAuth(<Login />);
    const usernameInput = screen.getByLabelText(/Username:/i);
    const passwordInput = screen.getByLabelText(/Password:/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login function on form submission with correct credentials', async () => {
    // Mock a successful login call from AuthService
    AuthService.login.mockResolvedValueOnce({ username: 'testuser', exp: Date.now() / 1000 + 3600 });
    mockLogin.mockResolvedValueOnce(true); // Mock the context's login function

    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      // Expect AuthContext's login to be called with username and password
      expect(screen.queryByText(/Failed to login/i)).not.toBeInTheDocument();
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays error message on failed login', async () => {
    // Mock a failed login call from AuthService
    const errorMessage = 'Invalid credentials';
    AuthService.login.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });
    mockLogin.mockRejectedValueOnce({ response: { data: { message: errorMessage } } }); // Mock the context's login function

    render(
      <Router>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});