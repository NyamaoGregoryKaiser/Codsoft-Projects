```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../../auth/AuthProvider';
import { LoginPage } from '../../auth/components/Login';
import api from '../../api';

// Mock the API calls
jest.mock('../../api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedApi.post.mockReset();
    mockedApi.get.mockReset();
    mockedUsedNavigate.mockReset();
  });

  const renderLoginPage = () =>
    render(
      <ChakraProvider>
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    );

  test('renders login form with email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  test('allows entering email and password', () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('shows loading state on submit', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} }); // Mock successful login
    mockedApi.get.mockResolvedValueOnce({ data: { id: 1, email: 'test@example.com' } }); // Mock fetch user

    renderLoginPage();
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.click(signInButton);
    expect(signInButton).toHaveAttribute('data-loading'); // Chakra UI adds this attr
  });

  test('navigates to home on successful login', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: {} }); // Mock successful login
    mockedApi.get.mockResolvedValueOnce({ data: { id: 1, email: 'test@example.com' } }); // Mock fetch user

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', { username: 'test@example.com', password: 'password123' });
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows error toast on failed login', async () => {
    const errorMessage = 'Incorrect email or password.';
    mockedApi.post.mockRejectedValueOnce({ response: { data: { detail: errorMessage } } });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockedUsedNavigate).not.toHaveBeenCalled();
  });
});
```