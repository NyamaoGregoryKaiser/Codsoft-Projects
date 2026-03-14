```javascript
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../pages/LoginPage';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed for Link component if used

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockLogin = jest.fn();
const mockRegister = jest.fn();

const renderLoginPage = (authContextValue) => {
  require('../hooks/useAuth').useAuth.mockReturnValue(authContextValue);
  return render(
    <Router>
      <LoginPage />
    </Router>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(true);
    mockRegister.mockResolvedValue(true);
  });

  // Mock initial auth context for unauthenticated state
  const unauthenticatedAuth = {
    isAuthenticated: false,
    user: null,
    loading: false,
    authError: null,
    login: mockLogin,
    register: mockRegister,
  };

  it('should render login form by default', () => {
    renderLoginPage(unauthenticatedAuth);
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it('should switch to register form when "Register" is clicked', async () => {
    renderLoginPage(unauthenticatedAuth);
    await act(async () => {
      await userEvent.click(screen.getByText(/Don't have an account\? Register/i));
    });

    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  it('should call login on form submission with valid data', async () => {
    renderLoginPage(unauthenticatedAuth);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call register on form submission with valid data', async () => {
    renderLoginPage(unauthenticatedAuth);

    await act(async () => {
      await userEvent.click(screen.getByText(/Don't have an account\? Register/i));
    });

    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'newpassword');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'newpassword');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Register/i }));
    });

    expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'newpassword');
  });

  it('should display local error if passwords do not match during registration', async () => {
    renderLoginPage(unauthenticatedAuth);

    await act(async () => {
      await userEvent.click(screen.getByText(/Don't have an account\? Register/i));
    });

    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'pass2');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Register/i }));
    });

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should display auth error from context', async () => {
    const authWithError = { ...unauthenticatedAuth, authError: 'Backend error message' };
    renderLoginPage(authWithError);

    expect(screen.getByText('Backend error message')).toBeInTheDocument();
  });
});
```