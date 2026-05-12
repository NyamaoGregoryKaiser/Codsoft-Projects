```javascript
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Mock localStorage for tests
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
    removeItem: function (key) {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock jwt-decode to avoid actual JWT parsing issues in tests
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    sub: 'test-user-id',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
    username: 'testuser',
    email: 'test@example.com',
  })),
}));

// Mock API calls if necessary, but for routing tests, sometimes it's enough to mock auth context
jest.mock('../api/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
}));

describe('App Routing', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders Login page for unauthenticated user', async () => {
    render(
      <Router>
        <App />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Welcome/i)).not.toBeInTheDocument();
  });

  test('renders Dashboard for authenticated user', async () => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');

    render(
      <Router>
        <App />
      </Router>
    );

    // Wait for the AuthProvider to process the token and render the protected route
    await waitFor(() => {
      expect(screen.getByText(/Welcome, testuser!/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Sign in to your account/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test('redirects to login if token is expired', async () => {
    localStorage.setItem('accessToken', 'expired-mock-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    
    // Mock jwtDecode to return an expired token
    require('jwt-decode').jwtDecode.mockReturnValueOnce({
      sub: 'test-user-id',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      username: 'expireduser',
      email: 'expired@example.com',
    });

    render(
      <Router>
        <App />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });
    expect(localStorage.getItem('accessToken')).toBeNull(); // Should be cleared
    expect(localStorage.getItem('refreshToken')).toBeNull(); // Should be cleared
  });

  test('renders Unauthorized page for forbidden access', async () => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    // Mock jwtDecode to return a viewer role (not admin)
    require('jwt-decode').jwtDecode.mockReturnValueOnce({
      sub: 'viewer-id',
      role: 'viewer',
      exp: Math.floor(Date.now() / 1000) + 3600,
      username: 'vieweruser',
      email: 'viewer@example.com',
    });

    // Manually navigate to an admin-only route
    window.history.pushState({}, 'Test page', '/users');

    render(
      <Router>
        <App />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/User Management/i)).not.toBeInTheDocument();
  });
});
```