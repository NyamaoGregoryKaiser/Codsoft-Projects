```javascript
// frontend/src/tests/pages/LoginPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import authService from '../../services/auth.service';
import { toast } from 'react-toastify';

// Mock child components like Navbar or Sidebar if they are rendered in App.js
// but not relevant for LoginPage tests. Or just test LoginPage directly.

// Mock external services/libraries
jest.mock('../../services/auth.service');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock useNavigate hook
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('LoginPage', () => {
  const mockSetIsAuthenticated = jest.fn();
  const mockSetUserRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('renders login form with email and password fields', () => {
    render(
      <Router>
        <LoginPage
          setIsAuthenticated={mockSetIsAuthenticated}
          setUserRole={mockSetUserRole}
        />
      </Router>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('allows entering email and password', () => {
    render(
      <Router>
        <LoginPage
          setIsAuthenticated={mockSetIsAuthenticated}
          setUserRole={mockSetUserRole}
        />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('password123');
  });

  it('handles successful login', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'mock-token',
      user: { role: 'user' },
    });

    render(
      <Router>
        <LoginPage
          setIsAuthenticated={mockSetIsAuthenticated}
          setUserRole={mockSetUserRole}
        />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSetIsAuthenticated).toHaveBeenCalledWith(true);
      expect(mockSetUserRole).toHaveBeenCalledWith('user');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/'); // Redirect to dashboard
    });
  });

  it('handles failed login', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(
      <Router>
        <LoginPage
          setIsAuthenticated={mockSetIsAuthenticated}
          setUserRole={mockSetUserRole}
        />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('wrong@example.com', 'wrongpass');
      expect(mockSetIsAuthenticated).not.toHaveBeenCalled();
      expect(mockSetUserRole).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to registration page when "Register here" is clicked', () => {
    render(
      <Router>
        <LoginPage
          setIsAuthenticated={mockSetIsAuthenticated}
          setUserRole={mockSetUserRole}
        />
      </Router>
    );

    fireEvent.click(screen.getByText(/register here/i));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/register');
  });
});
```