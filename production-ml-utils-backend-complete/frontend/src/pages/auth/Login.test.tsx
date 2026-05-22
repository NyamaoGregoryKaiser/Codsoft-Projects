```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '@/contexts/AuthContext';
import * as useFetchModule from '@/hooks/useFetch'; // Mock this module
import * as routerModule from 'react-router-dom'; // Mock useNavigate

// Mock the usePost hook
const mockPostData = jest.fn();
jest.spyOn(useFetchModule, 'usePost').mockReturnValue({
  data: null,
  loading: false,
  error: null,
  postData: mockPostData,
  setData: jest.fn(),
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.spyOn(routerModule, 'useNavigate').mockReturnValue(mockNavigate);


describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock for usePost and useNavigate before each test
    (useFetchModule.usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      postData: mockPostData,
      setData: jest.fn(),
    });
    (routerModule.useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('renders login form elements', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /don't have an account\? sign up/i })).toBeInTheDocument();
  });

  it('allows user to type in email and password fields', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls login API and redirects on successful login', async () => {
    const user = userEvent.setup();
    const mockToken = 'mock-jwt-token';
    mockPostData.mockResolvedValue({ token: mockToken });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockPostData).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBe(mockToken); // AuthContext updates localStorage
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockPostData.mockRejectedValueOnce({
      response: {
        data: { message: errorMessage },
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables login button during loading state', async () => {
    (useFetchModule.usePost as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      postData: jest.fn(),
      setData: jest.fn(),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeDisabled();
  });
});
```