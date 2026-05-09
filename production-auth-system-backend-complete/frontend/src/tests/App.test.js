import { render, screen } from '@testing-library/react';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext'; // Mock AuthProvider for isolated testing
import { BrowserRouter as Router } from 'react-router-dom';

// Mock the AuthProvider to control authentication state for tests
const MockAuthProvider = ({ children, isAuthenticated = false, user = null, loading = false, hasRole = () => false }) => (
  <AuthProvider value={{ isAuthenticated, user, loading, login: jest.fn(), logout: jest.fn(), hasRole }}>
    {children}
  </AuthProvider>
);

describe('App Routing and Auth State', () => {
  test('renders login page for unauthenticated user on /', () => {
    render(
      <Router>
        <MockAuthProvider isAuthenticated={false} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument(); // Header link
  });

  test('renders dashboard page for authenticated user on /', () => {
    const mockUser = { id: 1, email: 'test@example.com', full_name: 'Test User', roles: [{ name: 'user' }] };
    render(
      <Router>
        <MockAuthProvider isAuthenticated={true} user={mockUser} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument(); // Page content
    expect(screen.getByText(`Hello, ${mockUser.full_name}!`)).toBeInTheDocument(); // Header greeting
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument(); // Form
  });

  test('renders login page on /login path', () => {
    window.history.pushState({}, 'Login page', '/login');
    render(
      <Router>
        <MockAuthProvider isAuthenticated={false} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('renders register page on /register path', () => {
    window.history.pushState({}, 'Register page', '/register');
    render(
      <Router>
        <MockAuthProvider isAuthenticated={false} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  test('renders dashboard page on /dashboard path for authenticated user', () => {
    window.history.pushState({}, 'Dashboard page', '/dashboard');
    const mockUser = { id: 1, email: 'test@example.com', full_name: 'Test User', roles: [{ name: 'user' }] };
    render(
      <Router>
        <MockAuthProvider isAuthenticated={true} user={mockUser} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/welcome to your dashboard!/i)).toBeInTheDocument();
  });

  test('redirects unauthenticated user from /dashboard to /login', () => {
    window.history.pushState({}, 'Dashboard page', '/dashboard');
    render(
      <Router>
        <MockAuthProvider isAuthenticated={false} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    // Check if it renders content from LoginPage
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('renders admin page for authenticated admin user', () => {
    window.history.pushState({}, 'Admin page', '/admin');
    const mockUser = { id: 1, email: 'admin@example.com', full_name: 'Admin User', roles: [{ name: 'admin' }] };
    render(
      <Router>
        <MockAuthProvider isAuthenticated={true} user={mockUser} loading={false} hasRole={(roles) => roles.includes('admin')}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
  });

  test('redirects non-admin user from /admin to /dashboard', () => {
    window.history.pushState({}, 'Admin page', '/admin');
    const mockUser = { id: 1, email: 'user@example.com', full_name: 'Regular User', roles: [{ name: 'user' }] };
    render(
      <Router>
        <MockAuthProvider isAuthenticated={true} user={mockUser} loading={false} hasRole={() => false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    // Check if it renders content from DashboardPage
    expect(screen.getByText(/welcome to your dashboard!/i)).toBeInTheDocument();
  });

  test('renders 404 page for unknown routes', () => {
    window.history.pushState({}, 'Unknown page', '/unknown-route');
    render(
      <Router>
        <MockAuthProvider isAuthenticated={false} loading={false}>
          <App />
        </MockAuthProvider>
      </Router>
    );
    expect(screen.getByText(/404 - page not found/i)).toBeInTheDocument();
  });
});
```