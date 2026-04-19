```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from 'pages/Auth/Login';
import { AuthContext } from 'contexts/AuthContext';
import { authApi } from 'api/api';
import { UserRole } from 'types/auth';

// Mock AuthContext values
const mockLogin = jest.fn();
const mockAuthContextValue = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: mockLogin,
  logout: jest.fn(),
  fetchUser: jest.fn(),
};

// Mock API calls
jest.mock('api/api', () => ({
  authApi: {
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authApi.login as jest.Mock).mockResolvedValue({
      data: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
    });
    (authApi.getMe as jest.Mock).mockResolvedValue({
      data: { id: '1', username: 'testuser', email: 'test@example.com', role: UserRole.USER },
    });
  });

  it('renders login form fields', () => {
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account\? Register/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    });
    await waitFor(() => {
        expect(authApi.getMe).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'mock_access_token',
        'mock_refresh_token',
        { id: '1', username: 'testuser', email: 'test@example.com', role: UserRole.USER }
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on failed login', async () => {
    (authApi.login as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading state during login attempt', async () => {
    (authApi.login as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Keep promise pending

    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(screen.getByRole('button', { name: /Logging In.../i })).toBeDisabled();
  });
});
```