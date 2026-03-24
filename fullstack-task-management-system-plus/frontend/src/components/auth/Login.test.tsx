import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { vi } from 'vitest';
import Login from './Login';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Mock the useAuth hook and toast notifications
const mockLogin = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
    loading: false,
  }),
}));

vi.mock('react-toastify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: mockToastSuccess,
      error: mockToastError,
    },
  };
});


describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginComponent = () => {
    render(
      <Router>
        <AuthContext.Provider value={{
            isAuthenticated: false,
            user: null,
            loading: false,
            login: mockLogin,
            register: vi.fn(),
            logout: vi.fn()
        }}>
          <Login />
        </AuthContext.Provider>
      </Router>
    );
  };

  test('renders login form with username and password fields', () => {
    renderLoginComponent();
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account\? Register/i)).toBeInTheDocument();
  });

  test('allows typing in username and password fields', () => {
    renderLoginComponent();
    const usernameInput = screen.getByLabelText(/Username or Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpassword');
  });

  test('calls login function on form submission with correct credentials', async () => {
    renderLoginComponent();
    const usernameInput = screen.getByLabelText(/Username or Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(usernameInput, { target: { value: 'validuser' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('validuser', 'validpassword');
      expect(mockToastSuccess).toHaveBeenCalledWith('Login successful!');
    });
  });

  test('shows error toast on failed login', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    renderLoginComponent();

    const usernameInput = screen.getByLabelText(/Username or Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(usernameInput, { target: { value: 'invaliduser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('invaliduser', 'wrongpass');
      expect(mockToastError).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});