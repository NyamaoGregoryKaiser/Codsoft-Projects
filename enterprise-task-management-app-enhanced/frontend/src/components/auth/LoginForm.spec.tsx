import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';

// Mock the AuthContext value
const mockAuthContextValue = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  isLoading: false,
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('renders username and password input fields', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('updates input values on change', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls login function with correct credentials on form submission', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthContextValue.login).toHaveBeenCalledTimes(1);
      expect(mockAuthContextValue.login).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('shows error toast on failed login', async () => {
    mockAuthContextValue.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Login failed: Invalid credentials');
    });
  });

  it('disables submit button while loading', () => {
    // Override isLoading to true for this test
    const loadingAuthContextValue = { ...mockAuthContextValue, isLoading: true };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={loadingAuthContextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /log in/i });
    expect(submitButton).toBeDisabled();
  });
});