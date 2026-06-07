```typescript
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as authApi from '../api/auth';
import * as localStorage from '../utils/localStorage';

// Mock the API calls
jest.mock('../api/auth');
const mockLogin = authApi.login as jest.Mock;
const mockRegister = authApi.register as jest.Mock;
const mockGetMe = authApi.getMe as jest.Mock;

// Mock localStorage
jest.mock('../utils/localStorage', () => ({
  setAccessToken: jest.fn(),
  getAccessToken: jest.fn(),
  removeAccessToken: jest.fn(),
  setStoredUser: jest.fn(),
  getStoredUser: jest.fn(),
  removeStoredUser: jest.fn(),
}));
const mockSetAccessToken = localStorage.setAccessToken as jest.Mock;
const mockGetAccessToken = localStorage.getAccessToken as jest.Mock;
const mockRemoveAccessToken = localStorage.removeAccessToken as jest.Mock;
const mockSetStoredUser = localStorage.setStoredUser as jest.Mock;
const mockGetStoredUser = localStorage.getStoredUser as jest.Mock;
const mockRemoveStoredUser = localStorage.removeStoredUser as jest.Mock;


// Helper component to display auth state for testing
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="is-loading">{isLoading ? 'Loading' : 'Not Loading'}</span>
      <span data-testid="is-authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
      <span data-testid="username">{user ? user.username : 'No User'}</span>
      <button onClick={() => login('testuser', 'password')} data-testid="login-button">Login</button>
      <button onClick={() => logout()} data-testid="logout-button">Logout</button>
      <button onClick={() => register({ username: 'reguser', email: 'reg@example.com', password: 'password' })} data-testid="register-button">Register</button>
    </div>
  );
};

// Setup for routing
const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={ui} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  is_active: true,
  is_admin: false,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockToken = {
  access_token: 'fake-jwt-token',
  token_type: 'bearer',
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockReturnValue(null);
    mockGetStoredUser.mockReturnValue(null);
  });

  it('should initialize as loading and not authenticated if no token', async () => {
    renderWithRouter(<TestComponent />);

    expect(screen.getByTestId('is-loading')).toHaveTextContent('Loading');
    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('No User');
  });

  it('should load user from local storage and API if token exists', async () => {
    mockGetAccessToken.mockReturnValue(mockToken.access_token);
    mockGetStoredUser.mockReturnValue(mockUser);
    mockGetMe.mockResolvedValue(mockUser);

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent(mockUser.username);
    expect(mockGetMe).toHaveBeenCalledTimes(1);
  });

  it('should log in a user successfully', async () => {
    mockLogin.mockResolvedValue(mockToken);
    mockGetMe.mockResolvedValue(mockUser);

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));

    act(() => {
      userEvent.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('testuser', 'password'));
    await waitFor(() => expect(mockSetAccessToken).toHaveBeenCalledWith(mockToken.access_token));
    await waitFor(() => expect(mockGetMe).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSetStoredUser).toHaveBeenCalledWith(mockUser));
    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Authenticated'));
    expect(screen.getByTestId('username')).toHaveTextContent(mockUser.username);
  });

  it('should handle login failure', async () => {
    mockLogin.mockRejectedValue({ response: { data: { detail: 'Invalid credentials' } } });

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));

    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockGetMe).not.toHaveBeenCalled();
    expect(mockSetStoredUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('No User');
  });

  it('should log out a user', async () => {
    mockGetAccessToken.mockReturnValue(mockToken.access_token);
    mockGetStoredUser.mockReturnValue(mockUser);
    mockGetMe.mockResolvedValue(mockUser);

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Authenticated'));

    act(() => {
      userEvent.click(screen.getByTestId('logout-button'));
    });

    await waitFor(() => expect(mockRemoveAccessToken).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRemoveStoredUser).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('No User');
    expect(screen.getByText('Login Page')).toBeInTheDocument(); // Redirected to login
  });

  it('should register a user successfully and log them in', async () => {
    mockRegister.mockResolvedValue(mockUser);
    mockLogin.mockResolvedValue(mockToken); // simulate login after registration
    mockGetMe.mockResolvedValue(mockUser);

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));

    act(() => {
      userEvent.click(screen.getByTestId('register-button'));
    });

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith({
      username: 'reguser',
      email: 'reg@example.com',
      password: 'password'
    }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('reguser', 'password'));
    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Authenticated'));
    expect(screen.getByTestId('username')).toHaveTextContent(mockUser.username);
  });

  it('should clear auth state if token is invalid during loadUser', async () => {
    mockGetAccessToken.mockReturnValue(mockToken.access_token);
    mockGetStoredUser.mockReturnValue(mockUser);
    mockGetMe.mockRejectedValue(new Error('Invalid token')); // Simulate invalid token

    renderWithRouter(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Not Loading'));
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('No User');
    expect(mockRemoveAccessToken).toHaveBeenCalledTimes(1);
    expect(mockRemoveStoredUser).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login Page')).toBeInTheDocument(); // Redirected to login
  });
});
```