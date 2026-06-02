import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';

// Mock localStorage for tests
const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App Component', () => {
  test('renders homepage for unauthenticated user', () => {
    // Ensure localStorage is clear for this test
    localStorage.clear();

    render(
      <ConfigProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    );

    // Check if the home page content is rendered
    expect(screen.getByText(/Welcome to ETMS/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  test('renders dashboard for authenticated user', async () => {
    // Mock a token that indicates authentication
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImF1dGgiOiJUSERUIiwiZXhwIjoxNjk5ODQyNjE3LCJpYXQiOjE2OTk3NTYyMTd9.some_jwt_token";
    localStorage.setItem('jwtToken', mockToken); // Set a mock token

    render(
      <ConfigProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    );

    // Since the initial route is "/", AuthProvider will process the token
    // and if valid, it should lead to a redirect to /dashboard.
    // However, in Jest/React Testing Library, redirects are not fully simulated in this way.
    // We can check if dashboard-related elements are present, assuming AuthContext works.
    // A more robust E2E test would verify the actual redirect.

    // Given the current setup, we might need to wait for rendering updates.
    // For this simplified test, we'll check for elements visible on the dashboard route
    // if the navigation effectively happened.
    // Note: This relies on the internal logic of AuthProvider setting isAuthenticated.
    expect(await screen.findByText(/Welcome back, testuser!/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument(); // Check for element on DashboardPage
  });

  test('renders login page when navigating to /login', () => {
    localStorage.clear(); // Ensure unauthenticated
    render(
      <ConfigProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    );
    window.history.pushState({}, 'Login', '/login'); // Manually navigate

    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

});