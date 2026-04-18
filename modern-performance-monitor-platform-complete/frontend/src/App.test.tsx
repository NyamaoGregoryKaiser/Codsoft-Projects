```typescript jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock AuthContext for tests that don't need real authentication logic
jest.mock('./context/AuthContext', () => ({
  AuthContext: {
    Consumer: ({ children }: any) => children({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    }),
  },
  AuthProvider: ({ children }: any) => <>{children}</>,
}));


describe('App Component', () => {
  it('renders Login page by default if not authenticated', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check for an element specific to the Login page
    expect(screen.getByText(/Login to PerfoMetrics/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
  });

  it('renders Dashboard when authenticated (mocked)', () => {
    // Mock AuthContext to simulate authentication
    jest.mock('./context/AuthContext', () => ({
      AuthContext: {
        Consumer: ({ children }: any) => children({
          isAuthenticated: true,
          user: { username: 'testuser', role: 'viewer' },
          login: jest.fn(),
          logout: jest.fn(),
          loading: false,
        }),
      },
      AuthProvider: ({ children }: any) => <>{children}</>,
    }));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check for an element specific to the Dashboard page or authenticated header
    expect(screen.getByText(/PerfoMetrics Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome, testuser/i)).toBeInTheDocument();
  });
});
```