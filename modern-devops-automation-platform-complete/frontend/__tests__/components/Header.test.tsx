```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/contexts/AuthContext';
import { toast } from 'react-toastify';

// Mock the useAuth hook
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
  },
  ToastContainer: () => null, // Mock ToastContainer as it's not relevant for header rendering
}));

const mockUseAuth = useAuth as jest.Mock;

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders login and register links when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    expect(screen.queryByText(/Hello,/)).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders project, profile, and logout links when authenticated', () => {
    const mockUser = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
    };
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <Router>
        <Header />
      </Router>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText(`Hello, ${mockUser.username}!`)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('calls logout and shows toast on logout button click', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '123', username: 'testuser', email: 'test@example.com' },
      loading: false,
      login: jest.fn(),
      logout: mockLogout,
      refreshUser: jest.fn(),
    });

    render(
      <Router>
        <Header />
      </Router>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith('Logged out successfully!');
  });

  it('displays "ProjectFlow" brand link', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <Router>
        <Header />
      </Router>
    );

    const brandLink = screen.getByText('ProjectFlow');
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });
});
```