```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App'; // Adjust path as needed
import { AuthProvider } from '../src/context/AuthContext'; // Import AuthProvider

// Mock API calls if App directly fetches data on load
jest.mock('../src/services/authService', () => ({
  checkAuth: jest.fn(() => Promise.resolve(null)), // Mock checkAuth to return null (not authenticated)
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));


describe('App Component', () => {
  it('renders login page by default when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Login to your account/i)).toBeInTheDocument();
    expect(screen.queryByText(/Welcome to ChatApp/i)).not.toBeInTheDocument(); // Assuming this is on a protected route
  });

  it('renders chat rooms when authenticated', () => {
    // Mock the useAuth hook to return an authenticated state
    (require('../src/context/AuthContext') as { useAuth: jest.Mock }).useAuth.mockReturnValue({
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      user: { id: 1, username: 'testuser' },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    // Assuming a protected route like /chat or /rooms is redirected to when authenticated
    expect(screen.getByText(/Your Rooms/i)).toBeInTheDocument(); // Assuming a ChatRoomList component with this text
    expect(screen.queryByText(/Login to your account/i)).not.toBeInTheDocument();
  });

  it('navigates to registration page', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Create a new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login to your account/i)).not.toBeInTheDocument();
  });
});
```