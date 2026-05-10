import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import apiClient from '../../api/api-client';
import { useAuthStore } from '../../contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock the API client
jest.mock('../../api/api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const queryClient = new QueryClient();

const renderLoginPage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Router>
        <ToastProvider>
          <LoginPage />
        </ToastProvider>
      </Router>
    </QueryClientProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset Zustand store state for each test
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, loading: false });
    mockedApiClient.post.mockReset();
  });

  it('renders login form correctly', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: {
        token: 'fake-jwt-token',
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        },
      },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    });
  });

  it('displays error message on failed login', async () => {
    const errorMessage = 'Incorrect email or password';
    mockedApiClient.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('shows loading state during login', async () => {
    mockedApiClient.post.mockReturnValueOnce(new Promise(() => {})); // Never resolves to keep loading state

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /log in/i })).toHaveClass('opacity-60');
  });
});