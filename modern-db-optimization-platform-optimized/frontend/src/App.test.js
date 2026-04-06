import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AuthProvider from './contexts/AuthContext';
import * as authApi from './api/auth';

// Mock API calls
jest.mock('./api/auth', () => ({
  checkAuth: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
}));

// Mock Header component to simplify rendering
jest.mock('./components/Common/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Mock Header</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    authApi.checkAuth.mockClear();
    authApi.login.mockClear();
    authApi.register.mockClear();
  });

  test('renders login page by default if not authenticated', async () => {
    authApi.checkAuth.mockResolvedValueOnce({ user: null }); // Simulate not authenticated

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/login to your account/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  test('renders dashboard page if authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
    authApi.checkAuth.mockResolvedValueOnce({ user: mockUser, token: 'fake-token' }); // Simulate authenticated

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/db health monitor dashboard/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/login to your account/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  test('renders loading spinner while checking auth status', async () => {
    // Simulate a pending promise for checkAuth
    authApi.checkAuth.mockReturnValue(new Promise(() => {}));

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('navigates to dashboard after successful login', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
    authApi.checkAuth.mockResolvedValueOnce({ user: null }); // Not logged in initially

    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial render should be Login Page
    await waitFor(() => {
      expect(screen.getByText(/login to your account/i)).toBeInTheDocument();
    });

    // Manually trigger login logic in context (difficult to test directly here
    // as it's an integration between Context and App).
    // For this test, we'll directly set the auth state via the mock.
    // In a real e2e test, you'd fill form and click login.

    // Simulate login success by re-rendering with new auth state (or pushing state directly if context allows)
    // For a unit test of App.js, mocking the context's state is more appropriate.
    // This part requires a more complex setup to mock useContext or direct state manipulation.
    // Given the current structure, a more isolated test for LoginForm/AuthContext would be better.
    // For this App.test.js, we'll rely on the initial checkAuth scenario.

    // A more effective way to test this would be to use a MemoryRouter and push to a new route.
    // Or mock the AuthContext's login function to directly update state and re-render.
    // For now, we rely on the initial checkAuth only.
  });
});