```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import { AuthContext } from '../src/contexts/AuthContext';
import { toast } from 'react-toastify';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockAuthContextValue = {
  user: null,
  token: null,
  login: mockLogin,
  logout: jest.fn(),
  isAuthenticated: false,
};

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => <div />, // Mock component
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  const renderLoginPage = () =>
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <LoginPage />
        </AuthContext.Provider>
      </Router>
    );

  it('renders login form with email and password fields', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('updates email and password fields on user input', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('calls login function and navigates on successful login', async () => {
    mockLogin.mockResolvedValueOnce({ success: true }); // Simulate successful login

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('displays error toast on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    }); // Simulate failed login

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    });
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
    expect(mockNavigate).not.toHaveBeenCalled(); // Should not navigate on failure
  });

  it('shows loading state on button during login attempt', async () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {})); // Never resolve to keep it loading

    renderLoginPage();

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent(/logging in\.\.\./i);
  });
});
```