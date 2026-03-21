import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/context/AuthContext'; // Assume AuthProvider is mocked for simplicity
import { useRouter } from 'next/navigation';

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, // Simple passthrough
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

describe('ProtectedRoute', () => {
  let mockUseAuth: jest.Mock;
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockUseAuth = useAuth as jest.Mock;
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders children when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' }, loading: false });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">This is protected content.</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('redirects to login when no user and not loading', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">This is protected content.</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows loading message when auth state is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">This is protected content.</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading or redirecting...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not render children immediately if loading, even with user', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' }, loading: true });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">This is protected content.</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading or redirecting...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled(); // No redirect if loading, will wait
  });
});