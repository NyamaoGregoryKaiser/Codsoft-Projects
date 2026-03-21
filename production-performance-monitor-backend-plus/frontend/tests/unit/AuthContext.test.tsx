import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

// Mock API calls
jest.mock('@/utils/api', () => ({
  api: {
    post: jest.fn(() => Promise.resolve({ data: { access_token: 'new_access_token' } })),
    getAuthToken: jest.fn(() => null),
    setAuthToken: jest.fn(),
    // Mock other methods as needed
    get: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock Cookies
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => '/'),
}));


const TestComponent = () => {
  const { user, loading, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'Loading...' : 'Loaded'}</span>
      <span data-testid="user">{user ? user.email : 'No User'}</span>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => register('new@example.com', 'newpassword')}>Register</button>
    </div>
  );
};

describe('AuthProvider', () => {
    let mockRouter: any;

    beforeEach(() => {
        (api.post as jest.Mock).mockClear();
        (api.getAuthToken as jest.Mock).mockClear();
        (api.setAuthToken as jest.Mock).mockClear();
        (Cookies.get as jest.Mock).mockClear();
        (Cookies.remove as jest.Mock).mockClear();
        (jwtDecode as jest.Mock).mockClear();

        mockRouter = {
            push: jest.fn(),
            replace: jest.fn(),
            reload: jest.fn(),
            prefetch: jest.fn(),
        };
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

  it('starts in a loading state and no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('attempts to refresh token on initial load if no access token but refresh token exists', async () => {
    (Cookies.get as jest.Mock).mockReturnValue('mock_refresh_token');
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { access_token: 'refreshed_access_token' } });
    (jwtDecode as jest.Mock).mockReturnValue({
        user_id: 1,
        email: 'test@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) + 3600, // valid token
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
      expect(api.setAuthToken).toHaveBeenCalledWith('refreshed_access_token');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  it('handles successful login', async () => {
    (api.post as jest.Mock)
      .mockResolvedValueOnce({ data: { access_token: 'mock_access_token' } }) // For login
      .mockResolvedValueOnce({ data: { access_token: 'new_access_token' } }); // For refresh (initial load)

    (jwtDecode as jest.Mock).mockReturnValue({
        user_id: 1,
        email: 'test@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('Loaded')); // Wait for initial load to complete

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/auth/token',
        { username: 'test@example.com', password: 'password123' },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      expect(api.setAuthToken).toHaveBeenCalledWith('mock_access_token');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  it('handles successful logout', async () => {
    // Setup initial login state
    (api.getAuthToken as jest.Mock).mockReturnValue('mock_access_token');
    (jwtDecode as jest.Mock).mockReturnValue({
        user_id: 1,
        email: 'test@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/logout');
      expect(api.setAuthToken).toHaveBeenCalledWith(null);
      expect(Cookies.remove).toHaveBeenCalledWith('refresh_token');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  it('handles access token expiration and successful refresh', async () => {
    // Mock an expired access token initially
    (api.getAuthToken as jest.Mock).mockReturnValue('expired_access_token');
    (jwtDecode as jest.Mock).mockImplementation((token: string) => {
        if (token === 'expired_access_token') {
            return { user_id: 1, email: 'expired@example.com', is_admin: false, exp: Math.floor(Date.now() / 1000) - 60 };
        }
        if (token === 'new_access_token') {
            return { user_id: 1, email: 'refreshed@example.com', is_admin: false, exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        throw new Error('Invalid token');
    });
    (Cookies.get as jest.Mock).mockReturnValue('mock_refresh_token'); // A valid refresh token

    // Mock the refresh endpoint to return a new valid access token
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { access_token: 'new_access_token' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
        expect(api.setAuthToken).toHaveBeenCalledWith('new_access_token');
        expect(screen.getByTestId('user')).toHaveTextContent('refreshed@example.com');
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  it('handles refresh token failure', async () => {
    // Mock an expired access token initially
    (api.getAuthToken as jest.Mock).mockReturnValue('expired_access_token');
    (jwtDecode as jest.Mock).mockImplementation((token: string) => {
        if (token === 'expired_access_token') {
            return { user_id: 1, email: 'expired@example.com', is_admin: false, exp: Math.floor(Date.now() / 1000) - 60 };
        }
        throw new Error('Invalid token');
    });
    (Cookies.get as jest.Mock).mockReturnValue('mock_refresh_token');
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh failed')); // Simulate refresh failure

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {});
      expect(api.setAuthToken).toHaveBeenCalledWith(null);
      expect(Cookies.remove).toHaveBeenCalledWith('refresh_token');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
  });

  it('handles registration and automatically logs in', async () => {
    (api.post as jest.Mock)
      .mockResolvedValueOnce({ data: {} }) // For register call
      .mockResolvedValueOnce({ data: { access_token: 'register_access_token' } }); // For login after register

    (jwtDecode as jest.Mock).mockReturnValue({
        user_id: 2,
        email: 'new@example.com',
        is_admin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('Loaded'));

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register', { email: 'new@example.com', password: 'newpassword' });
        expect(api.post).toHaveBeenCalledWith(
            '/api/v1/auth/token',
            { username: 'new@example.com', password: 'newpassword' },
            expect.anything()
        );
        expect(api.setAuthToken).toHaveBeenCalledWith('register_access_token');
        expect(screen.getByTestId('user')).toHaveTextContent('new@example.com');
    });
  });
});